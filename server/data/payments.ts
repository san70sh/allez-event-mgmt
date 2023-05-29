import IEvent from "../models/events.model";
import IUser from "../models/users.model";
import Stripe from "stripe";
import dotenv from 'dotenv';
import joi from "joi";
import { ObjectId } from 'mongodb';
import usersdata from "./users";
import { collections, events, users } from "../config/mongoCollections";
import { ErrorWithStatus } from "../types/global";

dotenv.config();

const stripe_key = process.env.STRIPE_PRIVATE_KEY;
if (!stripe_key) {
    throw new Error("Stripe Key is not set");
}

const stripe = new Stripe(stripe_key, {
    apiVersion: '2022-11-15'
});

type EventProduct = {
    id?: string,
    name: string,
    description: string,
    images: string[],
    metadata: {
        category: string,
        totalSeats: number,
        hostId: string,
        minAge: number,
        eventStartTime: string,
        eventEndTime: string
    }
}


type EventPrice = {
    id?: string,
    product: string,
    currency: string,
    unit_amount: number,
    billing_scheme: Stripe.Price.BillingScheme
}

type Address = {
    line1: string,
    city: string,
    state: string,
    country: string,
    postal_code: string
}

type EventCustomer = {
    id?: string,
    name: string,
    email: string,
    phone: string,
    metadata: {
        gender: string,
        dateOfBirth: Date
    }
    address: Address,
    shipping: {
        address: Stripe.Emptyable<Stripe.AddressParam>
        name: string,
        phone: string
    }
}

type Card = {
    number: string,
    exp_month: number,
    exp_year: number,
    cvc: string
}

const eventValidationSchema: joi.ObjectSchema = joi.object({
    name: joi.string().required(),
    category: joi.array().required(),
    venue: {
        address: joi.string().required(),
        city: joi
            .string()
            .pattern(/^[a-z ,.'-]+$/i)
            .required(),
        state: joi
            .string()
            .pattern(/^[a-z ,.'-]+$/i)
            .required(),
        country: joi
            .string()
            .pattern(/^[a-z ,.'-]+$/i)
            .required(),
        zip: joi.number().required(),
        // geoLocation: {
        //   lat: joi.number().required(),
        //   long: joi.number().required(),
        // },
    },
    eventImg: joi.optional(),
    bookedSeats: joi.number().min(0),
    totalSeats: joi.number().min(0).required(),
    minAge: joi.number().required(),
    hostId: joi.string().required(),
    cohostArr: joi.array(),
    attendeesArr: joi.array(),
    description: joi.string().required(),
    price: joi.number().required().min(0),
    eventDate: joi.date().required().greater("now"),
    eventStartTime: joi.string().required(),
    eventEndTime: joi.string().required(),
    evt_stripeid: joi.string(),
    payment_url: joi.string()
});


async function addEvent(event: IEvent): Promise<{eventId: string, payment_url: string} | null> {

    await eventValidationSchema.validateAsync(event);

    let newEvent: EventProduct = {
        "id": event._id?.toString(),
        "name": event.name,
        "description": event.description,
        "images": [`${process.env.CLOUDFRONT_URL}/${event.eventImg}`],
        "metadata": {
            "category": event.category.toString(),
            "totalSeats": event.totalSeats,
            "hostId": event.hostId.toString(),
            "minAge": event.minAge,
            "eventStartTime": event.eventStartTime,
            "eventEndTime": event.eventEndTime
        }
    }

    let insertedEvent = await stripe.products.create(newEvent);
    if (insertedEvent) {
        let eventPrice = await addEventRegFee(insertedEvent.id, event.price)
        if (eventPrice) {
            let payment_url = await generatePaymentLink(eventPrice.id)
            if (payment_url) {
                return {eventId: insertedEvent.id, payment_url: payment_url}
            } else {
                return null
            }
        } else {
            return null
        }
    } else {
        let err: ErrorWithStatus = {
            status: 500,
            message: "Unable to create event in Stripe"
        }
        throw err
    }
}

async function getEvent(eventID: string): Promise<Stripe.Response<Stripe.Product>> {
    if (!eventID) {
        throw [400, "Bad Request, please enter a valid eventID"];
    }
    else {
        let event = await stripe.products.retrieve(eventID);
        if (event) {
            return event;
        } else {
            throw [404, "The event with this ID is not found."]
        }
    }
}

async function modifyEvent(event: IEvent): Promise<EventProduct> {

    await eventValidationSchema.validateAsync(event);

    let modEvent: EventProduct = {
        "id": event._id?.toString(),
        "name": event.name,
        "description": event.description,
        "images": [`${process.env.CLOUDFRONT_URL}/${event.eventImg}`],
        "metadata": {
            "category": event.category.toString(),
            "totalSeats": event.totalSeats,
            "hostId": event.hostId.toString(),
            "minAge": event.minAge,
            "eventStartTime": event.eventStartTime,
            "eventEndTime": event.eventEndTime
        }
    }
    let stripe_evt = await getEvent(event.evt_stripeid!);
    if(stripe_evt) {
        let updatedEvt = await stripe.products.update(
            event._id!.toString(),
            modEvent
        );
    }
    updateEventRegFee(event._id!.toString(), event.price)
    return modEvent
}

async function removeEvent(eventID: string): Promise<Stripe.Response<Stripe.Product>> {
    if (!eventID) {
        throw [400, "Bad Request, please enter a valid eventID"];
    } else {
        let event = await stripe.products.retrieve(eventID);
        if (event) {
            let delEvent = await stripe.products.update(event.id, { active: false });
            return delEvent
        } else {
            throw [404, "This event does not exist in Stripe"];
        }
    }
}

async function addEventRegFee(eventID: string, price: number): Promise<Stripe.Response<Stripe.Price> | undefined> {
    if (!eventID) {
        throw [400, "Bad Parameters, Please enter a valid event ID"]
    }
    else {
        let event = await stripe.products.retrieve(eventID);
        if (event) {
            let eventFee: EventPrice = {
                product: eventID,
                currency: "usd",
                unit_amount: price * 100,
                billing_scheme: "per_unit",
            }

            let newFee = await stripe.prices.create(eventFee)
            if (newFee) {
                return newFee;
            } else {
                throw [400, "Unable to add price to event."]
            }
        }
    }
}

async function updateEventRegFee(eventID: string, price: number): Promise<Stripe.Response<Stripe.Price>> {
    if (!eventID) {
        throw [400, "Bad Parameters, Please enter a valid event ID"]
    }
    else {
        let event = await stripe.products.retrieve(eventID);
        if (event) {
            let eventFee: Stripe.Response<Stripe.ApiList<Stripe.Price>> = await stripe.prices.list({
                product: event.id,
                active: true
            })

            if (eventFee.data && eventFee.data.length > 0) {
                let eventPriceId: string = eventFee.data[0].id;
                let updatedPriceObj = await stripe.prices.update(eventPriceId, { active: false });
                if (!updatedPriceObj.active) {
                    let eventFee: EventPrice = {
                        product: event.id,
                        currency: "usd",
                        unit_amount: price * 100,
                        billing_scheme: "per_unit",
                    }
                    let newPriceObj = await stripe.prices.create(eventFee);
                    return newPriceObj;
                } else {
                    throw [500, "Unable to modify price from the product"]
                }
            } else {
                throw [404, "This product does not have any active prices."]
            }
        } else {
            throw [400, "This event does not exist in Stripe."]
        }
    }
}
async function generatePaymentLink(priceId: string): Promise<string>{
    if(!priceId) {
        let err: ErrorWithStatus = {
            status: 400,
            message: "Bad Parameters: Invalid PriceID"
        }
        throw err
    } else {
        let paymentLink = await stripe.paymentLinks.create({
            line_items: [
                {
                    price: priceId,
                    quantity: 1
                }
            ]
        });
        if (paymentLink) {
            return paymentLink.url
        } else {
            let err: ErrorWithStatus = {
                status: 500,
                message: "Unable to generate payment link for event"
            }
            throw err
        }
    }
}

async function getEventPrice(eventId: string): Promise<string> {
    if (!eventId) {
        throw [400, "Bad Parameters, Please enter a valid event ID"]
    }
    else {
        let event = await stripe.products.retrieve(eventId);
        if (event) {
            let eventFee: Stripe.Response<Stripe.ApiList<Stripe.Price>> = await stripe.prices.list({
                product: event.id,
                active: true
            })

            if (eventFee.data && eventFee.data.length > 0) {
                let eventPriceId: string = eventFee.data[0].id;
                return eventPriceId;
            } else {
                throw [404, "This product does not have any active prices."]
            }
        } else {
            throw [400, "This event does not exist in Stripe."]
        }
    }
}

// async function addCustomer(customer: IUser) {
//     let newCustomer: Stripe.CustomerCreateParams = {
//         name: `${customer.firstName} ${customer.lastName}`,
//         email: customer.email,
//         phone: customer.phone.toString(),
//         metadata: {
//             gender: customer.gender,
//         },

//         shipping: {
//             name: `${customer.firstName} ${customer.lastName}`,
//             address: {
//                 city: customer.address.city,
//                 country: customer.address.country,
//                 state: customer.address.state,
//                 postal_code: customer.address.postal_code.toString()
//             },
//             phone: customer.phone.toString()
//         }
//     }

//     let insertedCustomer = await stripe.customers.create(newCustomer)
//     return insertedCustomer;
// }

// async function searchCustomer(email: string) {
//     let emailRegex: RegExp = /^\S+@\S+\.\S+$/;
//     if (!email) {
//         throw [400, "Please enter an email"];
//     } else if (email.trim().length === 0 || !emailRegex.test(email)) {
//         throw [400, "Invalid Email"];
//     } else {
//         try {
//             let { data } = await stripe.customers.search({ query: `email:"${email}"` })
//             let idList: string[] = [];
//             if (data && data.length > 0) {
//                 data.forEach(e => {
//                     idList.push(e.id);
//                 })
//                 return idList;
//             }
//         } catch (e) {
//             console.log(e);
//         }
//     }
// }
// async function removeCustomer(customerID: string) {
//     if (!customerID) {
//         throw [400, "Invalid Customer Details"];
//     } else {
//         let customer = await stripe.customers.retrieve(customerID);
//         if (customer && !Object.keys(customer).includes('deleted')) {
//             let delCustomer = await stripe.customers.del(customerID);
//             return delCustomer.deleted;
//         }
//     }
// }

// async function createSession(eventId: string, custId: string) {

//     if (!ObjectId.isValid(eventId.toString())) throw [400, "Event ID Is Invalid"]
//     if (!ObjectId.isValid(custId.toString())) throw [400, "User ID Is Invalid"]
//     let userData = await usersdata.getUserById(custId.toString().trim())
//     let dob = userData.dateOfBirth
//     let ageInYears = new Date().getFullYear() - new Date(dob).getFullYear();
//     let eventId_objId = new ObjectId(eventId.toString().trim())
//     await events();
//     let requestedEvent = await collections.events?.findOne({ _id: eventId_objId })

//     if (!requestedEvent) throw [400, "Event Not Found"]
//     if (ageInYears < requestedEvent?.minAge) throw [400, "You Do Not Meet The Minimum Age Requirements To Attend This Event."]
//     if (requestedEvent?.totalSeats === requestedEvent?.bookedSeats) {
//         throw [400, 'Event Is Full Already']
//     }
//     if (custId === requestedEvent?.hostId) {
//         throw [400, "You're the Host"]
//     }
//     if (requestedEvent?.cohostArr?.includes(custId)) {
//         throw [400, "You're A Cohost"]
//     }
//     else {
//         if (userData.attendEventArray.includes(eventId)) {
//             throw [400, "You Have Already Registered For The Event"]
//         } else {
//             try {
//                 const eventPriceID: string = await getEventPrice(eventId);
//                 await users();
//                 let user = await collections.users?.findOne({ _id: new ObjectId(custId) });
//                 if (user) {
//                     let custEmail = user.email;
//                     // let custId = await searchCustomer(custEmail);
//                     // if(custId && custId.length > 0) {}
//                     const session: Stripe.Response<Stripe.Checkout.Session> = await stripe.checkout.sessions.create({
//                         success_url: "http://localhost:5173/",
//                         cancel_url: "http://localhost:3000/error",
//                         line_items: [
//                             { price: eventPriceID, quantity: 1 }
//                         ],
//                         customer_creation: "always",
//                         payment_method_types: ["card"],
//                         mode: "payment"
//                     })
//                     return session.url;
//                 }

//             } catch (e) {
//                 console.log(e);
//             }
//         }
    // }
// }

// async function expireSession() {

// }


// async function paymentMethod (cardDetails: Card, address: Address) {
//     let {cvc, number, exp_month, exp_year} = cardDetails;
//     if()
// }


// async function createPaymentIntent(amount: number, customerId: string, eventId: string, email: string) {
//     try {
//         if(!amount || !customerId || !eventId) {
//             console.log('Invalid Details');
//         } else {
//             let customer: Stripe.Response<Stripe.Customer | Stripe.DeletedCustomer> = await stripe.customers.retrieve(customerId);
//             if(customer && Object.keys(customer).includes('email')) {
//                 email = (customer as Stripe.Customer).email!;
//             }
//             let newPaymentIntent: Stripe.PaymentIntentCreateParams = {
//                 amount: amount*100,
//                 customer: customerId,
//                 currency: 'usd',
//                 confirm: true,
//                 receipt_email: email,
//                 metadata: {
//                     eventId: eventId
//                 }
//             }

//             let createdIntent = await stripe.paymentIntents.create(newPaymentIntent)
//             return createdIntent;
//         }
//     } catch(e) {
//         console.log(e);
//     }
// }

export default {
    addEvent,
    getEvent,
    modifyEvent,
    removeEvent,
    addEventRegFee,
    updateEventRegFee,
    // addCustomer,
    // removeCustomer,
    // createPaymentIntent,
    // createSession
}
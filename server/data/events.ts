import joi from "joi";
import { GridFSBucketReadStream, ObjectId } from "mongodb";
import { collections, events, images } from "../config/mongoCollections.js";
import IEvent from "../models/events.model";
import { ErrorWithStatus } from "../types/global";
import users from "./users.js";
import payments from "./payments.js";

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
  evt_stripeid: joi.string().optional(),
  payment_url: joi.string(),
  cohostArr: joi.array(),
  attendeesArr: joi.array(),
  description: joi.string().required(),
  price: joi.number().required().min(0),
  eventDate: joi.date().required().greater("now"),
  eventStartTime: joi.string().required(),
  eventEndTime: joi.string().required()
});

const validityCheck = (id: string | undefined, eventId: string | undefined) => {
  if (eventId && !ObjectId.isValid(eventId)) {
    let err: ErrorWithStatus = {
      message: "Invalid Event ID",
      status: 400,
    };
    throw err;
  }

  if (id && !ObjectId.isValid(id)) {
    let err: ErrorWithStatus = {
      message: "Invalid ID",
      status: 400,
    };
    throw err;
  }
};

async function createEvent(eventDetails: IEvent): Promise<IEvent> {
  console.log(eventDetails)
  await eventValidationSchema.validateAsync(eventDetails);
  console.log("Completed Data Validation")
  let authId: string = eventDetails.hostId.split("|")[1];
  validityCheck(authId, undefined);

  let newEvent: IEvent = {
    name: eventDetails.name.trim(),
    category: eventDetails.category,
    hostId: eventDetails.hostId,
    evt_stripeid: undefined,
    payment_url: undefined,
    venue: {
      address: eventDetails.venue.address.trim(),
      city: eventDetails.venue.city.trim(),
      state: eventDetails.venue.state.trim(),
      country: eventDetails.venue.country.trim(),
      zip: eventDetails.venue.zip,
      // geoLocation: {
      //   lat: eventDetails.venue.geoLocation.lat,
      //   long: eventDetails.venue.geoLocation.long,
      // },
    },
    minAge: eventDetails.minAge,
    price: eventDetails.price,
    description: eventDetails.description,
    eventImg: eventDetails.eventImg,
    eventDate: eventDetails.eventDate,
    eventStartTime: eventDetails.eventStartTime,
    eventEndTime: eventDetails.eventEndTime,
    totalSeats: eventDetails.totalSeats,
    bookedSeats: eventDetails.bookedSeats,
    cohostArr: eventDetails.cohostArr,
    attendeesArr: eventDetails.attendeesArr,
  };

  await events();
  let existingEvent = await collections.events?.findOne({
    $and: [
      { name: newEvent.name },
      {
        venue: {
          city: newEvent.venue.city,
        },
      },
    ],
  });
  if (!existingEvent) {
    let stripe_eventParams = await payments.addEvent(newEvent)
    if (stripe_eventParams) {

      newEvent.evt_stripeid = stripe_eventParams.eventId;
      newEvent.payment_url = stripe_eventParams.payment_url;

      let insertedEvent = await collections.events?.insertOne(newEvent);
      if (insertedEvent?.acknowledged == false) {
        let err: ErrorWithStatus = {
          message: "Unable to register event",
          status: 500,
        };
        throw err;
      } else {
        if (insertedEvent?.insertedId) {
          let authId: string = newEvent.hostId.split("|")[1];
          let updatedUser = await users.addHostedEvents(authId, insertedEvent.insertedId.toString());
          if (updatedUser) {
            return getEventById(insertedEvent?.insertedId.toString());
          } else {
            let err: ErrorWithStatus = {
              message: "Unable to update event in user",
              status: 400,
            };
            throw err;
          }
        } else {
          let err: ErrorWithStatus = {
            message: "Unable to retrieve eventId",
            status: 404,
          };
          throw err;
        }
      }
    } else {
      let err: ErrorWithStatus = {
        message: "Unable to add event to Stripe",
        status: 400,
      };
      throw err;
    }
  } else {
    let err: ErrorWithStatus = {
      message: "Event already present in database",
      status: 400,
    };
    throw err;
  }
}

async function getEventById(eventId: string): Promise<IEvent> {
  validityCheck(undefined, eventId);

  await events();

  let queryId: ObjectId = new ObjectId(eventId);

  let event: IEvent | null | undefined = await collections.events?.findOne({ _id: queryId });
  if (!event) {
    let err: ErrorWithStatus = {
      message: "Unable to find event in database",
      status: 404,
    };
    throw err;
  }

  event._id = event._id?.toString();
  return event;
}

async function modifyEvent(eventId: string, eventDetails: IEvent): Promise<IEvent> {
  await eventValidationSchema.validateAsync(eventDetails);

  validityCheck(undefined, eventId);

  let modifiedEvent: IEvent = {
    name: eventDetails.name.trim(),
    category: eventDetails.category,
    hostId: eventDetails.hostId,
    evt_stripeid: eventDetails.evt_stripeid,
    payment_url: eventDetails.payment_url,
    venue: {
      address: eventDetails.venue.address.trim(),
      city: eventDetails.venue.city.trim(),
      state: eventDetails.venue.state.trim(),
      country: eventDetails.venue.country.trim(),
      zip: eventDetails.venue.zip,
      // geoLocation: {
      //   lat: eventDetails.venue.geoLocation.lat,
      //   long: eventDetails.venue.geoLocation.long,
      // },
    },
    minAge: eventDetails.minAge,
    price: eventDetails.price,
    description: eventDetails.description,
    eventImg: eventDetails.eventImg,
    eventDate: eventDetails.eventDate,
    eventStartTime: eventDetails.eventStartTime,
    eventEndTime: eventDetails.eventEndTime,
    totalSeats: eventDetails.totalSeats,
    bookedSeats: eventDetails.bookedSeats,
    cohostArr: eventDetails.cohostArr,
    attendeesArr: eventDetails.attendeesArr,
  };

  await events();
  let existingEvent = await collections.events?.findOne({
    _id: new ObjectId(eventId),
  });

  if (existingEvent) {
    if (existingEvent.hostId != modifiedEvent.hostId) {
      let err: ErrorWithStatus = {
        message: "Invalid Host",
        status: 403,
      };
      throw err;
    } else {
      let updated_stripeEvt = await payments.modifyEvent(modifiedEvent)
      
      let updatedEvent = await collections.events?.updateOne(
        { _id: new ObjectId(eventId) },
        {
          $set: {
            name: modifiedEvent.name,
            category: modifiedEvent.category,
            venue: modifiedEvent.venue,
            eventImg: modifiedEvent.eventImg,
            totalSeats: modifiedEvent.totalSeats,
            price: modifiedEvent.price,
            description: modifiedEvent.description,
            eventDate: modifiedEvent.eventDate,
            eventStartTime: modifiedEvent.eventStartTime,
            eventEndTime: modifiedEvent.eventEndTime
          },
        }
      );
      if (updatedEvent?.modifiedCount == 0) {
        let err: ErrorWithStatus = {
          message: "Unable to modify event",
          status: 500,
        };
        throw err;
      } else {
        return getEventById(existingEvent._id?.toString());
      }
    }
  } else {
    let err: ErrorWithStatus = {
      message: "Unable to find event in database",
      status: 404,
    };
    throw err;
  }
}

async function deleteEvent(eventId: string, hostId: string): Promise<{ deleted: Boolean }> {
  validityCheck(hostId, eventId);

  let queryId: ObjectId = new ObjectId(eventId);
  await events();
  let existingEvent: IEvent | null | undefined = await collections.events?.findOne({ _id: queryId });
  if (existingEvent) {
    if (existingEvent.hostId != hostId) {
      let err: ErrorWithStatus = {
        message: "Invalid Host",
        status: 403,
      };
      throw err;
    } else {
      let deletedEvent = await collections.events?.deleteOne({ _id: queryId });
      if (deletedEvent?.deletedCount == 1) {
        return { deleted: true };
      } else {
        let err: ErrorWithStatus = {
          message: "Unable to delete event in database",
          status: 500,
        };
        throw err;
      }
    }
  } else {
    let err: ErrorWithStatus = {
      message: "Unable to find event in database",
      status: 404,
    };
    throw err;
  }
}

async function getAllEvents(): Promise<{ eventsData: IEvent[]; count: number }> {
  await events();
  let allEvents = await collections.events?.find().toArray();
  if (allEvents && allEvents.length > 0) {
    return {
      eventsData: allEvents,
      count: allEvents.length,
    };
  } else {
    return {
      eventsData: [],
      count: 0,
    };
  }
}

async function deleteAllEventsOfHost(hostId: string) {
  validityCheck(hostId, undefined);

  await events();
  let deletedEvent = await collections.events?.deleteMany({ hostId: hostId });
  if (deletedEvent?.acknowledged) {
    return { deleted: true };
  } else {
    let err: ErrorWithStatus = {
      message: "Unable to delete event in database",
      status: 500,
    };
    throw err;
  }
}


async function addCohost(eventId: string, cohostId: string, hostId: string): Promise<IEvent> {
  validityCheck(cohostId, eventId);

  await events();
  let queryId: ObjectId = new ObjectId(eventId);
  let queriedEvent: IEvent | null | undefined = await collections.events?.findOne({ _id: queryId });
  let updatedEvent;
  if (queriedEvent) {
    if (queriedEvent.hostId != hostId) {
      let err: ErrorWithStatus = {
        message: "Invalid Host",
        status: 403,
      };
      throw err;
    } else {
      let attendeesArr: string[] = queriedEvent.attendeesArr!;
      if (attendeesArr.includes(cohostId)) {
        updatedEvent = await collections.events?.updateOne(
          { _id: queryId },
          {
            $pull: {
              attendeesArr: cohostId,
            },
            $addToSet: {
              cohostArr: cohostId,
            },
          }
        );
      } else {
        updatedEvent = await collections.events?.updateOne(
          { _id: queryId },
          {
            $addToSet: {
              cohostArr: cohostId,
            },
          }
        );
      }

      if (updatedEvent?.modifiedCount == 1) {
        let event: IEvent = await getEventById(eventId);
        return event;
      } else {
        let err: ErrorWithStatus = {
          message: "Unable to update event",
          status: 500,
        };
        throw err;
      }
    }
  } else {
    let err: ErrorWithStatus = {
      message: "Unable to find event in database",
      status: 404,
    };
    throw err;
  }
}

async function removeCohost(eventId: string, cohostId: string, hostId: string): Promise<IEvent> {
  validityCheck(cohostId, eventId);

  await events();
  let queryId: ObjectId = new ObjectId(eventId);
  let queriedEvent: IEvent | null | undefined = await collections.events?.findOne({ _id: queryId });
  if (queriedEvent) {
    if (queriedEvent.hostId != hostId) {
      let err: ErrorWithStatus = {
        message: "Invalid Host",
        status: 403,
      };
      throw err;
    } else {
      let updatedEvent = await collections.events?.updateOne(
        { _id: queryId },
        {
          $pull: {
            cohostArr: cohostId,
          },
        }
      );

      if (updatedEvent?.modifiedCount == 1) {
        let event: IEvent = await getEventById(eventId);
        return event;
      } else {
        let err: ErrorWithStatus = {
          message: "Unable to remove cohost",
          status: 500,
        };
        throw err;
      }
    }
  } else {
    let err: ErrorWithStatus = {
      message: "Unable to find event in database",
      status: 404,
    };
    throw err;
  }
}

async function addAttendee(eventId: string, attendeeId: string): Promise<IEvent> {
  validityCheck(attendeeId, eventId);

  await events();
  let queryId: ObjectId = new ObjectId(eventId);
  let queriedEvent: IEvent | null | undefined = await collections.events?.findOne({ _id: queryId });
  let updatedEvent;
  if (queriedEvent) {
    let attendeesArr: string[] = queriedEvent.attendeesArr!;
    if (!attendeesArr.includes(attendeeId)) {
      updatedEvent = await collections.events?.updateOne(
        { _id: queryId },
        {
          $addToSet: {
            attendeesArr: attendeeId,
          },
        }
      );
    } else {
      let err: ErrorWithStatus = {
        message: "Already registered for this event",
        status: 400,
      };
      throw err;
    }

    if (updatedEvent?.modifiedCount == 1) {
      let event: IEvent = await getEventById(eventId);
      return event;
    } else {
      let err: ErrorWithStatus = {
        message: "Unable to update event",
        status: 500,
      };
      throw err;
    }
  } else {
    let err: ErrorWithStatus = {
      message: "Unable to find event in database",
      status: 404,
    };
    throw err;
  }
}

async function removeAttendee(eventId: string, attendeeId: string): Promise<IEvent> {
  validityCheck(attendeeId, eventId);
  await events();
  let queryId: ObjectId = new ObjectId(eventId);
  let queriedEvent: IEvent | null | undefined = await collections.events?.findOne({ _id: queryId });
  if (queriedEvent) {
    let updatedEvent = await collections.events?.updateOne(
      { _id: queryId },
      {
        $pull: {
          attendeesArr: attendeeId,
        },
      }
    );

    if (updatedEvent?.modifiedCount == 1) {
      let event: IEvent = await getEventById(eventId);
      return event;
    } else {
      let err: ErrorWithStatus = {
        message: "Unable to remove cohost",
        status: 500,
      };
      throw err;
    }
  } else {
    let err: ErrorWithStatus = {
      message: "Unable to find event in database",
      status: 404,
    };
    throw err;
  }
}

export default {
  createEvent,
  modifyEvent,
  deleteEvent,
  getAllEvents,
  getEventById,
  addCohost,
  removeCohost,
  addAttendee,
  removeAttendee,
  deleteAllEventsOfHost,
};

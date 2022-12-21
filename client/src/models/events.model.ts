// import mongoose, { Schema, ObjectId } from "mongoose";



export default interface IEvent {
    _id ?: string,
    eventImgs : string[],
    name : string,
    category : string[],
    price: number,
    description : string,
    totalSeats: number,
    bookedSeats : number,
    minAge: number,
    hostId : string,
    cohostArr ?: string[],
    attendeesArr ?: string[],
    venue: {
        address: string,
        city: string,
        state: string,
        zip: number,
        country: string,
        geoLocation: {lat: number, long: number}
    },
    eventTimeStamp: string

}

// const eventSchema = new Schema<IEvent>({
//     eventImgs : {type: [String]},
//     name : {type: String, required: true},
//     category : {type: [String], required: true},
//     price: {type: Number, required: true},
//     description : {type: String, required: true},
//     totalSeats: {type: Number, required: true},
//     bookedSeats : {type: Number, required: true},
//     minAge: {type: Number, required: true},
//     hostId: {type: String, required: true},
//     cohostArr: {type: [String], required: true},
//     attendeesArr: {type: [String], required: true},
//     venue: {
//         address: {type: String, required: true},
//         city: {type: String, required: true},
//         state: {type: String, required: true},
//         zip: {type: String, required: true},
//         geoLocation: {
//             lat: {type: Number, required: true},
//             long: {type: Number, required: true}
//         }
//     },
//     eventTimeStamp: {type: Date, required: true}
// })

// let eventsModel = mongoose.model('events', eventSchema);

// export default {eventsModel};
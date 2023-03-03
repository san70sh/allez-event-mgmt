// import mongoose, { Schema, ObjectId } from "mongoose";

import { ObjectId } from "mongodb"


export default interface IEvent {
    _id ?: ObjectId | string,
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

import {ObjectId} from "mongodb";

export default interface IUser {
    _id?: ObjectId | string,
    firstName: string,
    lastName: string,
    authId: string,
    profileImg: string,
    address: {
        city: string,
        state: string,
        postal_code: number,
        country: string,

    },
    phone: number,
    gender: string,
    dateOfBirth: string,
    email: string,
    hostEventArray: string[],
    cohostEventArray: string[],
    attendEventArray: string[]
}

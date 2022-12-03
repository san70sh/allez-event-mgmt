import {ObjectId} from "mongodb";

export default interface IUser {
    _id?: ObjectId | string,
    name: string,
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

// const userSchema = new Schema<IUser>( {
//     name: {type: String, required: true},
//     address: {
//         city: {type: String, required: true},
//         state: {type: String, required: true},
//         postal_code: {type: String, required: true},
//         country: {type: String, required: true},
//     },
//     phone: {type: Number, required: true},
//     gender: {type: String, required: true},
//     // dateOfBirth: {type: Date, required: true},
//     email: {type: String, required: true},
//     hostEventArray: {type: [String], required: true},
//     attendEventArray: {type: [String], required: true}

// })

// let userModel = mongoose.model('users', userSchema)
// console.log(userModel);
// export default userModel

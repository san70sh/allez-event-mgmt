export default interface IUser {
    _id?: string,
    firstName: string,
    lastName: string,
    authenticator: string,
    userId: string,
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
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
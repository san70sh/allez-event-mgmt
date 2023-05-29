export default interface IEvent {
    _id ?: string,
    eventImg : string,
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
    stripeId ?: string,
    payment_url ?: string,
    venue: {
        address: string,
        city: string,
        state: string,
        zip: number,
        country: string,
        // geoLocation: {lat: number, long: number}
    },
    eventDate: string,
    eventStartTime: string,
    eventEndTime: string

}
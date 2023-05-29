import axios, { AxiosResponse } from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import IEvent from "../models/events.model";
import { useAuth0 } from "@auth0/auth0-react";
import { ActionType } from "../@types/global";
import Map from "./Map";
import { LoadScriptProps, useJsApiLoader } from "@react-google-maps/api";

const libraries: LoadScriptProps["libraries"] = ["places"];

const EventDetail = () => {
	const { eventId } = useParams();
	const { user } = useAuth0();
	const [eventDat, setEventDat] = useState<IEvent>();
	const [mapLoaded, setMapLoaded] = useState<boolean>(false);

	const navigate = useNavigate();

	const { isLoaded, loadError } = useJsApiLoader({
		id: "google-script",
		googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API!,
		libraries: libraries,
	});
	useEffect(() => {
		let getEvent = async (eventId: string) => {
			const eventDetails: AxiosResponse<IEvent> = await axios.get(`http://localhost:3000/events/${eventId}`);
			if (eventDetails && eventDetails.status == 200) {
				setEventDat(eventDetails.data);
			}
		};
		getEvent(eventId!);
	}, []);

	useEffect(() => {
		setMapLoaded(isLoaded);
	}, [isLoaded]);

	return (
		<div className="mt-6">
			<div className="text-center text-3xl text-orange-500 font-semibold font-serif">
				<h1>{eventDat?.name}</h1>
			</div>
			<div className="text-center text-orange-700 font-medium my-7">{eventDat?.description}</div>
			<div className="grid grid-flow-col mx-4 space-x-6 text-center">
				<div className="rounded-lg shadow-lg p-4 max-h-screen">
					<div className="px-4 pt-4 pb-2">
						{eventDat &&
							eventDat.category.map((cat) => {
								return (
									<span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2" key={cat}>
										#{cat}
									</span>
								);
							})}
					</div>
					<p>
						{eventDat?.bookedSeats}/{eventDat?.totalSeats}
					</p>
					<p>Minimum Age: {eventDat?.minAge}</p>
					<p>
						Price: $ <strong>{eventDat?.price}</strong>
					</p>
					{/* <div className="grid grid-flow-col space-x-5">
						{user && eventDat && user.sub == eventDat.hostId ? (
							<button className="bg-red-600 py-2 px-auto rounded shadow-red-800 shadow-md outline-none text-gray-50 hover:text-red-800 hover:bg-orange-600 transition duration-300" onClick={() => navigate(`/events/${eventId}/modify`, { state: { type: ActionType.EDIT, eventId: eventDat._id } })}>
								Modify Event
							</button>
						) : {eventDat.price == 0 ? (<button className="bg-orange-400 py-2 px-auto rounded shadow-orange-500 shadow-md outline-none text-gray-50 hover:text-red-800 hover:bg-orange-600 transition duration-300">RSVP</button>) : (<button className="bg-orange-400 py-2 px-auto rounded shadow-orange-500 shadow-md outline-none text-gray-50 hover:text-red-800 hover:bg-orange-600 transition duration-300">Pay</button>)}}
					</div> */}
					<div className="grid grid-flow-col space-x-5">
						{eventDat && eventDat.price == 0 ? <button className="bg-orange-400 py-2 px-auto rounded shadow-orange-500 shadow-md outline-none text-gray-50 hover:text-red-800 hover:bg-orange-600 transition duration-300">RSVP</button> : <button onClick={() => window.location.href = eventDat?.payment_url!} className="bg-orange-400 py-2 px-auto rounded shadow-orange-500 shadow-md outline-none text-gray-50 hover:text-red-800 hover:bg-orange-600 transition duration-300">Pay</button>}
						{user && eventDat && user.sub == eventDat.hostId ? (
							<button className="bg-red-600 py-2 px-auto rounded shadow-red-800 shadow-md outline-none text-gray-50 hover:text-red-800 hover:bg-orange-600 transition duration-300" onClick={() => navigate(`/events/${eventId}/modify`, { state: { type: ActionType.EDIT, eventId: eventDat._id } })}>
								Modify Event
							</button>
						) : null}
					</div>
				</div>
				<div className="grid grid-rows-2 max-h-screen">
					<div className="h-fit row-start-1">{eventDat && mapLoaded ? <Map venue={Object.values(eventDat!.venue).join(", ")} /> : null}</div>
				</div>
			</div>
		</div>
	);
};

export default EventDetail;

import { Fragment, useEffect, useState } from "react";
import noImage from "../assets/noImage.jpg";
import { useAuth0 } from "@auth0/auth0-react";
import axios, { AxiosResponse } from "axios";
import IUser from "../models/users.model";
import IEvent from "../models/events.model";
import { Dialog, Transition } from "@headlessui/react";
import ProfileForm from "./ProfileForm";
import { Link } from "react-router-dom";
import { EventResponse, UserValues } from "../types/global";

const userProfile = () => {
	const { user, getAccessTokenSilently } = useAuth0();
	const [userDat, setUserDat] = useState<IUser>();
	const [userHostedEvents, setUserHostedEvents] = useState<IEvent[]>();
	const [userCohostedEvents, setUserCohostedEvents] = useState<IEvent[]>();
	const [userAttendedEvents, setUserAttendedEvents] = useState<IEvent[]>();
	const [openProfileForm, setOpenProfileForm] = useState<boolean>(false);
	let hostedEventsCards: JSX.Element[] = [];
	let cohostedEventsCards: JSX.Element[] = [];
	let registeredEventsCards: JSX.Element[] = [];

	useEffect(() => {
		let fetchUser = async () => {
			if (user) {
				let token = await getAccessTokenSilently({
					audience: "localhost:5173/api",
					scope: "read:current_user",
				});
				const userData: AxiosResponse<IUser> = await axios.get(`http://localhost:3000/users/`, {
					withCredentials: true,
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});
				if (userData) {
					setUserDat(userData.data);
					if (userData.data.hostEventArray.length > 0) {
						let eventsDat: AxiosResponse<EventResponse> = await axios.get(`http://localhost:3000/users/hostedEvents`, {
							withCredentials: true,
							headers: {
								Authorization: `Bearer ${token}`,
							},
						});
						let {count, events} = eventsDat.data;
						if (count > 0) {
							setUserHostedEvents(events);
						}
					}
					if (userData.data.cohostEventArray.length > 0) {
						let eventsDat: AxiosResponse<EventResponse> = await axios.get(`http://localhost:3000/users/cohostedEvents`, {
							withCredentials: true,
							headers: {
								Authorization: `Bearer ${token}`,
							},
						});
						let {count, events} = eventsDat.data;
						if (count > 0) {
							setUserCohostedEvents(events);
						}
					}
					if (userData.data.attendEventArray.length > 0) {
						let eventsDat: AxiosResponse<EventResponse> = await axios.get(`http://localhost:3000/users/registeredEvents`, {
							withCredentials: true,
							headers: {
								Authorization: `Bearer ${token}`,
							},
						});
						let {count, events} = eventsDat.data;
						if (count > 0) {
							setUserAttendedEvents(events);
						}
					}
				}
			}
		};
		fetchUser();
	}, []);

	const ProfileModal = () => {
		let initVal: UserValues;
		if (userDat) {
			initVal = {
				firstName: userDat.firstName,
						lastName: userDat.lastName,
						gender: userDat.gender,
						phone: userDat.phone.toString(),
						address: {
							postal_code: userDat.address.postal_code.toString(),
							city: userDat.address.city,
							state: userDat.address.state,
							country: userDat.address.country,
						},
						dateOfBirth: new Date(userDat.dateOfBirth),
			}

		}
		return (
			<div className="relative flex flex-col m-auto z-50">
				<Transition appear show={openProfileForm} as={Fragment}>
					<Dialog
						onClose={() => {
							setOpenProfileForm(false);
						}}
						open={openProfileForm}
						className="w-full"
						as="div">
						<Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
							<div className="inset-0 fixed opacity-50 bg-black" />
						</Transition.Child>
						<div className="fixed inset-0 overflow-y-auto">
							<div className="flex min-h-full items-center justify-center p-4 text-center w-full">
								<Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
									<Dialog.Panel className="transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
										<ProfileForm setFunction={setOpenProfileForm} action={1} val={initVal!}/>
									</Dialog.Panel>
								</Transition.Child>
							</div>
						</div>
					</Dialog>
				</Transition>
			</div>
		);
	};

	const eventCard = (event: IEvent): JSX.Element => {
		return (
		  <div
			className="rounded-xl overflow-hidden shadow-md hover:scale-110 hover:duration-150 duration-150"
			key={event._id}
		  >
			<Link to={`events/${event._id}`}>
			  <div className="relative m-4 text-center">
				<div className="font-bold text-lg my-2">{event.name}</div>
				<p className="text-gray-700 text-sm font-semibold">
				  {event.venue.city}, {event.venue.state}
				</p>
				<p className="text-gray-700 text-base font-semibold">
				  {event.bookedSeats} / {event.totalSeats}
				</p>
			  </div>
			  <div className="px-4 pt-4 pb-2">
				{event.category.map((cat) => {
				  return (
					<span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2" key={cat}>
					  #{cat}
					</span>
				  );
				})}
			  </div>
			</Link>
		  </div>
		);
	  };

	  if (userHostedEvents && userHostedEvents.length > 0) {
		hostedEventsCards = userHostedEvents.map((event) => {
			return eventCard(event);
		  });
	  }

	  if (userCohostedEvents && userCohostedEvents.length > 0) {
		cohostedEventsCards = userCohostedEvents.map((event) => {
			return eventCard(event);
		  });
	  }

	  if (userAttendedEvents && userAttendedEvents.length > 0) {
		registeredEventsCards = userAttendedEvents.map((event) => {
			return eventCard(event);
		  });
	  }
	
	return (
		<div>
			<div>
				<div className="rounded-full flex justify-center">{user && user.picture ? <img src={user.picture} alt="Profile Photo" referrerPolicy="no-referrer" /> : <img src={noImage} alt="Profile Photo" />}</div>
				<div className="flex justify-center">
					<p className="m-3 font-bold">{userDat?.firstName}</p>
					<p className="m-3 font-bold">{userDat?.lastName}</p>
				</div>
				<div className="flex justify-center">
					<button className="w-auto my-2 mx-3 p-3 bg-orange-700 hover:bg-orange-600 duration-200 shadow-orange-300 shadow-md rounded-md text-white" onClick={() => setOpenProfileForm(true)}>Manage Profile</button>
				</div>
				<div className="flex justify-center">
					<p className="font-thin">{userDat?.phone}</p>
				</div>
				<div className="flex justify-center">
					<p className="font-semibold">{userDat?.email}</p>
				</div>
				<div className="border-2 mx-64 my-10" />
				<ProfileModal/>
			</div>
			<div>
				<h1 className="text-2xl text-center mx-5">Hosted Events</h1>
				<div className="mt-5 mx-5 grid grid-flow-col-dense space-x-5 justify-items-stretch">{hostedEventsCards}</div>
			</div>
			<div className="border-2 mx-64 my-10" />
			<div>
				<h1 className="text-2xl text-center mx-5">Co-Hosted Events</h1>
				<div className="mt-5 mx-5 grid grid-flow-col-dense space-x-5 justify-items-stretch">{hostedEventsCards}</div>
			</div>
			<div className="border-2 mx-64 my-10" />
			<div>
				<h1 className="text-2xl text-center mx-5">Registered Events</h1>
				<div className="mt-5 mx-5 grid grid-flow-col-dense space-x-5 justify-items-stretch">{hostedEventsCards}</div>
			</div>
		</div>
	);
};

export default userProfile;

import React, { useEffect, useState } from "react";
import noImage from "../assets/noImage.jpg";
import { useAuth0 } from "@auth0/auth0-react";
import axios, { AxiosResponse } from "axios";
import IUser from "../models/users.model";
import IEvent from "../models/events.model";

const userProfile = () => {
	const { user, getAccessTokenSilently } = useAuth0();
	const [userDat, setUserDat] = useState<IUser>();
	const [userHostedEvents, setUserHostedEvents] = useState<IEvent[]>();
    const [userCohostedEvents, setUserCohostedEvents] = useState<IEvent[]>();
    const [userAttendedEvents, setUserAttendedEvents] = useState<IEvent[]>()

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
						let events: IEvent[] = await axios.get(`http://localhost:3000/users/hostedEvents`, {
							withCredentials: true,
							headers: {
								Authorization: `Bearer ${token}`,
							},
						});
						if (events.length > 0) {
							setUserHostedEvents(events);
						}
					}
                    if(userData.data.cohostEventArray.length > 0) {
                        let events: IEvent[] = await axios.get(`http://localhost:3000/users/hostedEvents`, {
							withCredentials: true,
							headers: {
								Authorization: `Bearer ${token}`,
							},
						});
						if (events.length > 0) {
							setUserCohostedEvents(events);
						}
                    }
                    if(userData.data.attendEventArray.length > 0) {
                        let events: IEvent[] = await axios.get(`http://localhost:3000/users/registeredEvents`, {
							withCredentials: true,
							headers: {
								Authorization: `Bearer ${token}`,
							},
						});
						if (events.length > 0) {
							setUserAttendedEvents(events);
						}
                    }
				}
			}
		};
		fetchUser();
	}, []);
	return (
		<div>
			<div></div>
			<div className="rounded-full flex justify-center">{user && user.picture ? <img src={user.picture} alt="Profile Photo" referrerPolicy="no-referrer" /> : <img src={noImage} alt="Profile Photo" />}</div>
			<div className="flex justify-center">
				<p className="m-3 font-bold">{userDat?.firstName}</p>
				<p className="m-3 font-bold">{userDat?.lastName}</p>
			</div>
			<div className="flex justify-center">
				<p className="font-thin">{userDat?.phone}</p>
			</div>
			<div className="flex justify-center">
				<p className="font-semibold">{userDat?.email}</p>
			</div>
			<div className="border-2 mx-64 my-10" />
		</div>
	);
};

export default userProfile;

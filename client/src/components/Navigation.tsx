import { useState, useEffect, Fragment } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import logo from "../assets/allez-dark.svg";
import { useAuth0 } from "@auth0/auth0-react";
import { ProfileDropDown, DropDownItem } from "./ProfileDropDown";
import ProfileForm from "./ProfileForm";
import { Dialog, Transition } from "@headlessui/react";
import axios, { AxiosError } from "axios";
import { ActionType, UserValues as Values } from "../@types/global";

const initVal: Values = {
	firstName: "",
	lastName: "",
	profileImg: "",
	gender: "",
	phone: "",
	address: {
		postal_code: "",
		city: "",
		state: "",
		country: "",
	},
	dateOfBirth: new Date(),
};


const events = () => {
	const { loginWithRedirect, logout, user, isAuthenticated, getAccessTokenSilently } = useAuth0();
	const [openProfileForm, setOpenProfileForm] = useState<boolean>(false);
	const [isProfilePresent, setIsProfilePresent] = useState<boolean>(true);
	const [profileImgURL, setProfileImgURL] = useState<string>("");
	let navigate = useNavigate();
	const homeRoute = () => {
		navigate("/");
	};

	useEffect(() => {
		async function getUser() {
			if (isAuthenticated) {
				const token = await getAccessTokenSilently({
					audience: "localhost:5173/api",
					scope: "read:current_user",
				});
				let validated_user = await axios
					.get("http://localhost:3000/users", {
						headers: {
							Authorization: `Bearer ${token}`,
						},
					})
					.catch((err: Error | AxiosError) => {
						console.log(err);
					});
				if (!validated_user) {
					setIsProfilePresent(false);
					setOpenProfileForm(true);
				} else {
					setIsProfilePresent(true);
					if(validated_user.data && validated_user.data.profileImg) {
						setProfileImgURL(`https://d2bgr0kljb65n3.cloudfront.net/${validated_user.data.profileImg}`)
					}
				}
			}
		}
		getUser();
	}, [isAuthenticated]);

	useEffect(() => {
		if (isAuthenticated && !isProfilePresent) {
			setOpenProfileForm(true);
		}
		if(user) {
			setProfileImgURL(user?.picture!)
		}
	}, [isAuthenticated, isProfilePresent]);

	const ProfileModal = () => {
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
										<ProfileForm setFunction={setOpenProfileForm} profileFunc={setIsProfilePresent} action={0} val={initVal}/>
									</Dialog.Panel>
								</Transition.Child>
							</div>
						</div>
					</Dialog>
				</Transition>
			</div>
		);
	};

	const loginFunc = async () => {
		try {
			loginWithRedirect({scope: "read:current_user", appState: {returnTo: window.location.pathname}});
		} catch (error) {
			console.log(error);
		}
	};

	const logoutFunc = () => {
		logout({ returnTo: window.location.origin });
	};

	const profileNavFunc = () => {
		navigate("/user");
	};

	const hostEvent = () => {
		if (isProfilePresent && isAuthenticated) {
			navigate("/events/new", {state: {type: ActionType.NEW}});
		} else if(isAuthenticated){
			setOpenProfileForm(true);
		} else {
			try {
				loginWithRedirect({scope: "read:current_user", appState: {returnTo: window.location.pathname}});
			} catch (error) {
				console.log(error);
			}
		}
	};

	const itemsList: DropDownItem[] = [
		{ name: "Profile", func: profileNavFunc },
		{ name: "Logout", func: logoutFunc },
	];

	return (
		<div>
			<div className="grid grid-cols-10 bg-gradient-to-b from-orange-300 to-transparent xl:h-48 sm:h-32 place-content-between">
				<div className="col-start-1 m-7">
					<label htmlFor="homeButton" hidden>
						Home
					</label>
					<button id="homeButton">
						<img src={logo} className="object-scale-down h-12" onClick={homeRoute} alt="Home" />
					</button>
				</div>
				<div className="col-start-9">
					<button className="w-32 my-12 mx-auto p-3 bg-orange-700 hover:bg-orange-600 duration-200 shadow-orange-300 shadow-md rounded-md text-white" onClick={hostEvent}>
						Host an Event
					</button>
				</div>
				<div className="col-start-10">
					{isAuthenticated && user ? (
						<ProfileDropDown header={{ user: user }} items={itemsList} profileImg={profileImgURL} />
					) : (
						<button className="bg-orange-400 text-orange-50 text-sm rounded-md p-4 font-medium mx-5 mt-11" onClick={loginFunc}>
							Login/Sign Up
						</button>
					)}
				</div>
				<ProfileModal />
			</div>
			<Outlet />
		</div>
	);
};

export default events;

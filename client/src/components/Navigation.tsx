import React, { useState, useEffect, Fragment } from "react";
import { Link, Outlet, redirect, useNavigate } from "react-router-dom";
import logo from "../assets/allez-dark.svg";
import { useAuth0 } from "@auth0/auth0-react";
import { ProfileDropDown, DropDownItem } from "./ProfileDropDown";
import LoginForm from "./LoginForm";
import { Dialog, Transition } from "@headlessui/react";

const events = () => {
  const { loginWithRedirect, logout, user, isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [openLogin, setOpenLogin] = useState<boolean>(false);
  let navigate = useNavigate();
  const homeRoute = () => {
    navigate("/")
  };


  const ProfileModal = () => {
    return (
			<div className="relative flex flex-col m-auto z-50">
				<Transition appear show={openLogin} as={Fragment}>
					<Dialog
						onClose={() => {
							setOpenLogin(false);
						}}
						open={openLogin}
						className="w-full"
						as="div">
						<Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
							<div className="inset-0 fixed opacity-50 bg-black" />
						</Transition.Child>
						<div className="fixed inset-0 overflow-y-auto">
							<div className="flex min-h-full items-center justify-center p-4 text-center w-full">
								<Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
									<Dialog.Panel className="transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                    <LoginForm />
                  </Dialog.Panel>
								</Transition.Child>
							</div>
						</div>
					</Dialog>
				</Transition>
			</div>
    )
  }

  const loginFunc = async () => {
    try {
      loginWithRedirect();
    } catch (error) {
      console.log(error);
    }
  };
  
  const logoutFunc = () => {
    logout({ returnTo: window.location.origin });
  };

  const profileNavFunc = () => {
    navigate("/user");
  }

  const itemsList: DropDownItem[] = [
    {name: "Profile", func: profileNavFunc}, {name: "Logout", func: logoutFunc}
  ]


  return (
    <div>
      <div className="grid grid-cols-3 bg-gradient-to-b from-orange-300 to-transparent xl:h-48 sm:h-32 place-content-between">
        <div className="col-start-1 m-7">
          <label htmlFor="homeButton" hidden>
            Home
          </label>
          <button id="homeButton">
            <img src={logo} className="object-scale-down h-12" onClick={homeRoute} alt="Home" />
          </button>
        </div>
        <div className="col-end-5">
          <button className="w-32 my-12 mx-3 p-3 bg-orange-700 hover:bg-orange-600 duration-200 shadow-orange-300 shadow-md rounded-md text-white" onClick={() => setOpenLogin(true)}>Host an Event</button>
        </div>
        <div className="col-end-6">
          {isAuthenticated && user ? (
            <ProfileDropDown header={{ user: user }} items={itemsList} />
          ) : (
            <button className="bg-orange-400 text-orange-50 rounded-md p-3 font-medium mx-7 my-12" onClick={loginFunc}>
              Login/Sign Up
            </button>
          )}
        </div>
        <ProfileModal/>
      </div>
      <Outlet />
    </div>
  );
};

export default events;

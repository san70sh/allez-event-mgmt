import React from "react";
import {Outlet, useNavigate} from "react-router-dom";
import logo from "../assets/allez-dark.svg"


const events = () => {
    let navigate = useNavigate();
    const homeRoute = () => {
        let path = '/';
        navigate(path)
    }
    return (
        <div>
            <div className="grid grid-cols-3 bg-gradient-to-b from-orange-300 to-transparent xl:h-48 sm:h-32 place-content-between">
                <div className="col-start-1 m-7">
                    <label htmlFor="homeButton" hidden>Home</label>
                    <button id="homeButton">
                        <img src={logo} className="object-scale-down h-12" onClick={homeRoute} alt="Home"/>
                    </button>
                </div>
                <div className="col-end-6 m-7">
                    <button className="bg-orange-400 text-orange-50 rounded-md p-3 font-medium">Login/Sign Up</button>
                </div>
            </div>
            <Outlet/>
        </div>
    )
}

export default events;
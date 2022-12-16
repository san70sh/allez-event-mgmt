import React from "react";
import {useNavigate} from "react-router-dom";
import logo from "../assets/allez-dark.svg"


const events = () => {
    let navigate = useNavigate();
    const homeRoute = () => {
        let path = '/';
        navigate(path)
    }
    return (
        <div>
            <div className="grid grid-cols-3 bg-orange-300 xl:h-40 sm:h-32 place-content-between">
                <div className="col-start-1 m-7">
                    <button>
                        <img src={logo} className="object-scale-down h-10" onClick={homeRoute}/>
                    </button>
                </div>
                <div className="col-end-6 m-5 mt-6">
                    <button className="bg-orange-400 text-orange-50 rounded-md p-3 font-medium">Login/Sign Up</button>
                </div>
            </div>
        </div>
    )
}

export default events;
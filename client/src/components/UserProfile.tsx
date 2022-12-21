import React from "react";
import { Outlet } from "react-router-dom";

const events = () => {
    return (
        <div className="text-center">
            <h1 className="text-2xl font-mono leading-7 text-gray-900 sm:text-3xl sm:truncate">User Profile</h1>
            <Outlet/>
        </div>
    )
}

export default events;
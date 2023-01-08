import React from "react";
import noImage from "../assets/noImage.jpg";
import {useAuth0} from "@auth0/auth0-react"

const userProfile = () => {
    const {user} = useAuth0();
    console.log(user)
    
    return (
        <div>
            <div>

            </div>
            <div className="rounded-full flex justify-center">
                <img src={noImage} alt="Profile Photo"/>
            </div>
            <div className="flex justify-center">
                <p className="m-3 font-bold">
                    First Name
                </p>
                <p className="m-3 font-bold">
                    Last Name
                </p>
            </div>
            <div className="flex justify-center">
                <p className="font-thin">
                    Phone
                </p>
            </div>
            <div className="flex justify-center">
                <p className="font-semibold">
                    Email
                </p>
            </div>
            <div className="border-2 mx-64 my-10"/>
        </div>
    )
}

export default userProfile;
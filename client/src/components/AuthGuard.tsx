import { withAuthenticationRequired } from "@auth0/auth0-react";
import LoadingSpinner from "./Loading";
import { ComponentType } from "react";
import { ActionType } from "../@types/global";
import { Location, useLocation } from "react-router-dom";

// type ActionProps = {
//     type: ActionType | undefined
// }
interface AuthGuardProps {
    // component: ComponentType<ActionProps>
    component: ComponentType
}

export const AuthGuard: React.FC<AuthGuardProps> = ({component}) => {
    const Component = withAuthenticationRequired(component, {
        onRedirecting: () => (
            <div>
                <LoadingSpinner width="12" height="12"/>
            </div>
        )
    });
    return <Component/>
}
import { withAuthenticationRequired } from "@auth0/auth0-react";
import LoadingSpinner from "./Loading";
import { ComponentType } from "react";
import { ActionType } from "../types/global";

type ActionProps = {
    type: ActionType
}
interface AuthGuardProps {
    component: ComponentType<ActionProps>
    props?: ActionProps
}

export const AuthGuard: React.FC<AuthGuardProps> = ({component, props}) => {
    const Component = withAuthenticationRequired(component, {
        onRedirecting: () => (
            <div>
                <LoadingSpinner width="12" height="12"/>
            </div>
        )
    });

    return <Component {...props!}/>
}
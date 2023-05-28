import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import LoadingSpinner from "./Loading";

const Auth: React.FC = () => {
  const { loginWithRedirect, isAuthenticated } = useAuth0();

  useEffect(() => {
    if (!isAuthenticated) {
      loginWithRedirect();
    }
  }, [loginWithRedirect, isAuthenticated]);
  return <LoadingSpinner width="12" height="12"/>
};

export default Auth;

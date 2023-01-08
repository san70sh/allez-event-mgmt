import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";

const Auth: React.FC = () => {
  const { loginWithRedirect, isAuthenticated } = useAuth0();

  useEffect(() => {
    if (!isAuthenticated) {
      loginWithRedirect();
    }
  }, [loginWithRedirect, isAuthenticated]);
  return <div>Loading...</div>;
};

export default Auth;

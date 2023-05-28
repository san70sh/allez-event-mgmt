import { Auth0Provider, AppState } from "@auth0/auth0-react";
import { Outlet, useNavigate } from "react-router-dom";


export const AuthProvider = (): JSX.Element | null => {
  const domain = import.meta.env.VITE_DOMAIN;
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const audience = import.meta.env.VITE_AUDIENCE;
  const redirect_uri = import.meta.env.VITE_AUTH0_CALLBACK_URL;
  const navigate = useNavigate();
  if (!(domain && clientId)) {
    return null;
  }

  const onRedirectCallback = (appState?: AppState) => {
    navigate(appState?.returnTo || window.location.pathname);
  };
  
  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      redirectUri={redirect_uri}
      onRedirectCallback={onRedirectCallback}
      audience={audience}

    >
      <Outlet />
    </Auth0Provider>
  );
};

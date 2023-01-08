import { Auth0Provider, AppState } from "@auth0/auth0-react";
import React, { PropsWithChildren } from "react";
import { Outlet, useNavigate } from "react-router-dom";

interface Auth0ProviderConfigProps {
  children?: React.ReactNode;
}

export const AuthProvider = ({ children }: PropsWithChildren<Auth0ProviderConfigProps>): JSX.Element | null => {
  const domain = import.meta.env.VITE_DOMAIN;
  const clientId = import.meta.env.VITE_CLIENT_ID;
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
      redirectUri={window.location.origin}
      onRedirectCallback={onRedirectCallback}
    >
      <Outlet />
    </Auth0Provider>
  );
};

import { createBrowserRouter, RouterProvider, useLocation, Outlet, Navigate } from "react-router-dom";
import React from "react";
import Auth from "./components/Auth";
import { AuthProvider } from "./components/AuthProvider";
import Home from "./components/Home";
import Navigation from "./components/Navigation";
import UserProfile from "./components/UserProfile";
import SignupForm from "./components/SignupForm";
import LoginForm from "./components/ProfileForm";
import { useAuth0 } from "@auth0/auth0-react";
import "./index.css";
import NewEvent from "./components/NewEvent";

const ProtectedRoute: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth0();
  return isAuthenticated ? <Outlet /> : <Navigate to="/auth" state={{ from: location }} replace />;
};

const router = createBrowserRouter([
  {
    element: <AuthProvider />,
    children: [
      {
        element: <Navigation />,
        children: [
          {
            path: "/",
            element: <Home />,
          },
          {
            element: <ProtectedRoute />,
            children: [
              {
                path: "/user",
                element: <UserProfile />,
              },
              {
                path: "/events/new",
                element: <NewEvent />
              }
            ],
          },
        ],
      },
      {
        path: "/auth",
        element: <Auth />,
      },
    ],
  },
]);

function App() {
  return (
    <RouterProvider router={router} />
  );
}

export default App;

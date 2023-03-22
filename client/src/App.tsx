import { createBrowserRouter, RouterProvider } from "react-router-dom";
// import React from "react";
import Auth from "./components/Auth";
import { AuthProvider } from "./components/AuthProvider";
import Home from "./components/Home";
import Navigation from "./components/Navigation";
import UserProfile from "./components/UserProfile";
// import { useAuth0 } from "@auth0/auth0-react";
import "./index.css";
import NewEvent from "./components/NewEvent";
import { Callback } from "./components/Callback";
import { AuthGuard } from "./components/AuthGuard";

// const ProtectedRoute: React.FC = () => {
// 	const location = useLocation();
// 	const { isAuthenticated } = useAuth0();

// 	return isAuthenticated ? <Outlet /> : <Navigate to="/auth" state={{ from: location }} replace />;
// };

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
						path: "/callback",
						element: <Callback />,
					},
					{
						path: "/user",
						element: <AuthGuard component={UserProfile} />
					},
					{
						path: "/events/new",
						element: <AuthGuard component={NewEvent} props={{type: 0}}/>,
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
	return <RouterProvider router={router} />;
}

export default App;

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./components/Home";
import Navigation from "./components/Navigation";
import UserProfile from "./components/UserProfile";
import SignupForm from "./components/SignupForm";
import LoginForm from "./components/LoginForm";
import "./index.css";

const router = createBrowserRouter([
  {
    element: <Navigation />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/user",
        element: <UserProfile />
      },
      {
        path: "/login",
        element: <LoginForm />
      }
    ],
  },
]);
function App() {
  return (<RouterProvider router={router} />)
}

export default App;

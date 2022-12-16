import {createBrowserRouter, RouterProvider} from "react-router-dom";
import Home from "./components/Home";
import Navigation from "./components/Navigation";
import UserProfile from "./components/UserProfile";
import './index.css'

const router = createBrowserRouter([
  {
    path: "/",
    element: [<Navigation/>, <Home/>],
  },
  {
    path: "/user",
    element: [<Navigation/>, <UserProfile/>]
  }
]);
function App() {
  return <RouterProvider router={router} />
}

export default App;

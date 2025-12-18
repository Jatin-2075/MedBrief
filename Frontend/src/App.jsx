import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Layout from "./Components/Layout";

import Home from "./Pages/Home";
import Dashboard from "./Pages/Dashboard";
import Reports from "./Pages/Reports";
import Smart_help from "./Pages/Smart_help";
import Upload from "./Pages/Upload";
import Intro from "./Pages/Intro";
import Login from "./Pages/Auth/Login";
import Signup from "./Pages/Auth/Signup";
import Help from "./Pages/Help";
import CreateProfile from "./Services/Profile/Profile_Create";

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/Home", element: <Home /> },
      { path: "/Dashboard", element: <Dashboard /> },
      { path: "/Reports", element: <Reports /> },
      { path: "/SmartHelper", element: <Smart_help /> },
      { path: "/Upload", element: <Upload /> },
      { path: "/Help", element: <Help /> },
    ],
  },

  { path: "/", element: <Intro /> },
  { path: "/Login", element: <Login /> },
  { path: "/Signup", element: <Signup /> },
  { path: "/Create_Profile", element: <CreateProfile/> },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;

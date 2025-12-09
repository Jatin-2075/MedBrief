import React from "react";
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import Home from "./Pages/Home";
import Dashboard from "./Pages/Dashboard";
import Reports from "./Pages/Reports";
import Smart_help from "./Pages/Smart_help";
import Upload from "./Pages/Upload";

function App() {

    const Router = createBrowserRouter([
        {
            path: '/',
            element: <> <Home/> </>
        },
        {
            path: '/Dashboard',
            element: <> <Dashboard/> </>
        },
        {
            path: '/Help',
            element: <> <Reports/> </>
        },
        {
            path: '/SmartHelper',
            element: <> <Smart_help/> </>
        },
        {
            path: '/Upload',
            element: <> <Upload/> </>
        }
    ])

    return <RouterProvider router={Router} />
}

export default App;

import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate
} from "react-router-dom";


import Login from './Login';
import ForgetPassword from './ForgetPassword';
import OtpPage from './OtpPage';
import ResetPassword from './ResetPassword';
import Dashboard from './dashboard';
import Sidebar from './assets/Components/Sidebar';
import Navbar from './assets/Components/Navbar';
import Students from './Students';
import Colleges from './Colleges';
// import Footer from './Footer';

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import University from './University';
import RolesPermissions from './RolesPermissions';
import Stream from './Stream';
import Degree from './Degree';
import Course from './Course';
import Specialization from './Specialization';
import ProtectedRoute from './ProtectedRoutes';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hideLayout = location.pathname === "/login";

  return (
    <div className="min-h-screen flex flex-col">

      {/* {!hideLayout && <Navbar />} */}

      <div className="flex flex-1">
        {!hideLayout && <Sidebar />}

        <div className="flex flex-col flex-1 min-w-0">

          <main className="flex-1 p-6">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/forgetPassword" element={<ForgetPassword />} />

              <Route 
              path="/dashboard"
               element={
                <ProtectedRoute>
                 <Dashboard />
                </ProtectedRoute>
               }
                />
              <Route path="/students" element={<Students />} />
              <Route path="/colleges" element={<Colleges />} />
              <Route path="/otpPage" element={<OtpPage />} />
              <Route path='/university' element={<University/>}/>
              <Route path="/resetPassword" element={<ResetPassword />} />
              <Route path="/role" element={<RolesPermissions/>}/>
              <Route path="/stream" element={<Stream/>}/>
              <Route path="/degree" element={<Degree/>}/>
              <Route path='/course' element={<Course/>}/>
              <Route path='/specializations' element={<Specialization/>}/>
            </Routes>
          </main>

          {/* {!hideLayout && <Footer />} */}

        </div>
      </div>

    </div>
  );
};


const App = () => {
  return (
    <BrowserRouter>
      <Layout />
      <ToastContainer />
    </BrowserRouter>
  );
};

export default App;
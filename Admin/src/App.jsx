import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";

import Login from "./Login";
import ForgetPassword from "./ForgetPassword";
import OtpPage from "./OtpPage";
import ResetPassword from "./ResetPassword";
import Dashboard from "./dashboard";

import Sidebar from "./assets/Components/Sidebar";
import Navbar from "./assets/Components/Navbar";
import Footer from "./assets/Components/Footer";
import DeletedModel from "./assets/Components/DeletedModel";

import Students from "./Students";
import Colleges from "./Colleges";
import University from "./University";
import RolesPermissions from "./RolesPermissions";
import Stream from "./Stream";
import Degree from "./Degree";
import Course from "./Course";
import Specialization from "./Specialization";
import ProtectedRoute from "./ProtectedRoutes";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Toaster } from "sonner";
import NotFound from "./NotFound";
import EmailTemplate from "./EmailTemplate";
import Contact from "./Contact";
import Users from "./Users";
import Settings from "./Settings";
import CounsellingRequests from "./CounsellingRequests";
import CounsellingAssignments from "./CounsellingAssignments";
import Appointments from "./Appointments";
import Sessions from "./Sessions";
import CounsellingNotes from "./CounsellingNotes";
import FollowUps from "./FollowUps";
import Feedback from "./Feedback";
// Routes
const AppRoutes = () => (
  <Routes>
    {/* Public routes */}
    <Route path="/" element={<Navigate to="/login" replace/>}/>
    <Route path="/login" element={<Login />} />
    <Route path="/forgetPassword" element={<ForgetPassword />} />
    <Route path="/otpPage" element={<OtpPage />} />
    <Route path="/resetPassword" element={<ResetPassword />} />

    {/* Protected Dashboard */}

    {/* All other protected routes */}
    <Route element={<ProtectedRoute />}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/students" element={<Students />} />
      <Route path="/users" element={<Users/>}/>
      <Route path="/colleges" element={<Colleges />} />

      <Route path="/university" element={<University />} />
      <Route path="/role" element={<RolesPermissions />} />
      <Route path="/stream" element={<Stream />} />
      <Route path="/degree" element={<Degree />} />
      <Route path="/course" element={<Course />} />
      <Route path="/email" element={<EmailTemplate/>}/>
      <Route path="/specializations" element={<Specialization />} />
      <Route path="/settings" element={<Settings/>}/>
      <Route path="/contact" element={<Contact/>}/>
      <Route path="/deletemodel" element={<DeletedModel />} />
      <Route path="/counselling/requests" element={<CounsellingRequests/>}/>
      <Route path="/counselling/assignments" element={<CounsellingAssignments/>}/>
      <Route path="/counselling/appointments" element={<Appointments/>}/>
      <Route path="/counselling/sessions" element={<Sessions/>}/>
      <Route path="/counselling/notes" element={<CounsellingNotes/>}/>
      <Route path="/counselling/followup" element={<FollowUps/>}/>
      <Route path="/Feedback" element={<Feedback/>}/>
    </Route>

    {/* Default route */}
    <Route
      path="*"
      element={<NotFound/>}
    />
  </Routes>
);

// Layout
const Layout = () => {
  const location = useLocation();

  const authRoutes = [
    "/",
    "/login",
    "/forgetPassword",
    "/otpPage",
    "/resetPassword",
  ];

  const hideLayout = authRoutes.includes(location.pathname);

  // Auth pages: no sidebar, navbar, or footer
  if (hideLayout) {
    return (
      <div className="h-screen w-full overflow-hidden">
        <AppRoutes />
      </div>
    );
  }

  // Other pages: sidebar + navbar + footer
  return (
    <div className="ml-64 min-h-screen flex flex-col bg-slate-100">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <div className="flex flex-col flex-1 min-w-0">
          <main className="flex-1 p-6">
            <AppRoutes />
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
};

// Main App
const App = () => {
  return (
    <BrowserRouter>
      <Layout />
      <ToastContainer />
      <Toaster position="top-right" richColors closeButton />
    </BrowserRouter>
  );
};

export default App;

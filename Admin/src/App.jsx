
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

import ProtectedRoute, {
  PermissionRoute,
} from "./ProtectedRoutes";

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

import { getDefaultRoute } from "./utils/accessControl";
import CounsellingPlans from "./CounsellingPlans";

const Unauthorized = () => (
  <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
    <h1 className="text-4xl font-bold text-slate-800">
      Access Denied
    </h1>

    <p className="mt-3 text-slate-500">
      You don't have permission to access any admin module.
    </p>

    <button
      onClick={() => {
        window.location.href = "/login";
      }}
      className="mt-5 rounded-lg bg-blue-600 px-5 py-2 text-white"
    >
      Back to Login
    </button>
  </div>
);

const AppRoutes = () => (
  <Routes>
    {/* Public routes */}
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="/login" element={<Login />} />
    <Route path="/forgetPassword" element={<ForgetPassword />} />
    <Route path="/otpPage" element={<OtpPage />} />
    <Route path="/resetPassword" element={<ResetPassword />} />

    {/* Protected routes */}
    <Route element={<ProtectedRoute />}>

      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Dashboard - SuperAdmin only */}
      <Route
        path="/dashboard"
        element={
          <PermissionRoute superAdminOnly>
            <Dashboard />
          </PermissionRoute>
        }
      />

      {/* Students and Users */}
      <Route
        path="/students"
        element={
          <PermissionRoute permission="student.view">
            <Students />
          </PermissionRoute>
        }
      />

      <Route
        path="/users"
        element={
          <PermissionRoute permission="user.view">
            <Users />
          </PermissionRoute>
        }
      />

      {/* Colleges and University */}
      <Route
        path="/colleges"
        element={
          <PermissionRoute permission="college.view">
            <Colleges />
          </PermissionRoute>
        }
      />

      <Route
        path="/university"
        element={
          <PermissionRoute permission="university.view">
            <University />
          </PermissionRoute>
        }
      />

      {/* Roles and academic modules */}
      <Route
        path="/role"
        element={
          <PermissionRoute permission="role.view">
            <RolesPermissions />
          </PermissionRoute>
        }
      />

      <Route
        path="/stream"
        element={
          <PermissionRoute permission="stream.view">
            <Stream />
          </PermissionRoute>
        }
      />

      <Route
        path="/degree"
        element={
          <PermissionRoute permission="degree.view">
            <Degree />
          </PermissionRoute>
        }
      />

      <Route
        path="/course"
        element={
          <PermissionRoute permission="course.view">
            <Course />
          </PermissionRoute>
        }
      />

      <Route
        path="/specializations"
        element={
          <PermissionRoute permission="specialization.view">
            <Specialization />
          </PermissionRoute>
        }
      />

      {/* Other existing modules - permission keys need verification */}
      <Route path="/email" element={<EmailTemplate />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/Feedback" element={<Feedback />} />

      <Route
        path="/settings"
        element={
          <PermissionRoute permission="settings.view">
            <Settings />
          </PermissionRoute>
        }
      />

      <Route
        path="/deletemodel"
        element={
          <PermissionRoute permission="deleteModel.view">
            <DeletedModel />
          </PermissionRoute>
        }
      />

      {/* Counselling */}
      <Route
        path="/counselling/requests"
        element={
          <PermissionRoute permission="counsellingRequest.view">
            <CounsellingRequests />
          </PermissionRoute>
        }
      />

      <Route
        path="/counselling/assignments"
        element={
          <PermissionRoute permission="counsellingAssignment.view">
            <CounsellingAssignments />
          </PermissionRoute>
        }
      />

      <Route
        path="/counselling/appointments"
        element={
          <PermissionRoute permission="appointment.view">
            <Appointments />
          </PermissionRoute>
        }
      />

      <Route
        path="/counselling/sessions"
        element={
          <PermissionRoute permission="counsellingSession.view">
            <Sessions />
          </PermissionRoute>
        }
      />

      <Route
        path="/counselling/notes"
        element={
          <PermissionRoute permission="counsellingNotes.view">
            <CounsellingNotes />
          </PermissionRoute>
        }
      />

      <Route
        path="/counselling/followup"
        element={
          <PermissionRoute permission="followUp.view">
            <FollowUps />
          </PermissionRoute>
        }
      />
    
    <Route
  path="/Packages"
  element={
    <PermissionRoute permission="counsellingPlan.view">
      <CounsellingPlans />
    </PermissionRoute>
  }
/>

    </Route>

    {/* Unknown route */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const Layout = () => {
  const location = useLocation();

  const authRoutes = [
    "/",
    "/login",
    "/forgetPassword",
    "/otpPage",
    "/resetPassword",
    "/unauthorized",
  ];

  const hideLayout = authRoutes.includes(location.pathname);

  if (hideLayout) {
    return (
      <div className="min-h-screen w-full">
        <AppRoutes />
      </div>
    );
  }

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

const App = () => (
  <BrowserRouter>
    <Layout />
    <ToastContainer />
    <Toaster position="top-right" richColors closeButton />
  </BrowserRouter>
);

export default App;

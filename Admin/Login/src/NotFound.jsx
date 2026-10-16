import React from "react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 text-center p-6">
      <h1 className="text-8xl font-bold text-blue-600">404</h1>

      <h2 className="text-2xl font-semibold mt-4">
        Page Not Found
      </h2>

      <p className="text-gray-600 mt-2">
        Sorry, the page you are looking for does not exist.
      </p>

      <button
        onClick={() => navigate("/dashboard")}
        className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Back to Dashboard
      </button>
    </div>
  );
};

export default NotFound;
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // bahar click karne par dropdown band
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

 const handleLogout = async () => {
  try {
    await fetch("http://localhost:8090/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    localStorage.removeItem("token");
    setOpen(false);
    navigate("/login", { replace: true });
  }
};

  return (
    <header className="sticky top-0 z-40 h-20 w-full bg-gray-800 border-b border-slate-700 px-8 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">Welcome back, Admin 👋</p>
      </div>

      {/* ===== Avatar + Dropdown ===== */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen(!open)}
          className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold hover:ring-4 hover:ring-blue-500/30 transition"
        >
          A
        </button>

        {open && (
          <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
            <button
              onClick={() => { navigate("/profile"); setOpen(false); }}
              className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-100"
            >
              👤 Profile
            </button>

            <button
              onClick={() => { navigate("/settings"); setOpen(false); }}
              className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-100"
            >
              ⚙️ Settings
            </button>

            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 border-t border-slate-100"
            >
              🚪 Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
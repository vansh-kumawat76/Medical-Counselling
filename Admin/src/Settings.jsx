
import React, { useState } from "react";
import {
  LockKeyhole,
  ShieldCheck,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import api from "./Api/axios";

// PasswordField is now outside Settings to prevent input remounting
const PasswordField = ({
  label,
  name,
  placeholder,
  visible,
  toggle,
  icon: Icon,
  value,
  onChange,
  autoComplete,
}) => (
  <div className="space-y-2">
    <label htmlFor={name} className="text-sm font-semibold text-slate-700">
      {label}
    </label>

    <div className="group relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
        <Icon
          size={19}
          className="text-slate-400 transition-colors group-focus-within:text-indigo-600"
        />
      </div>

      <input
        id={name}
        name={name}
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-12 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
      />

      <button
        type="button"
        onClick={toggle}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 transition-colors hover:text-indigo-600"
      >
        {visible ? <EyeOff size={19} /> : <Eye size={19} />}
      </button>
    </div>
  </div>
);

const Settings = () => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const togglePassword = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { currentPassword, newPassword, confirmPassword } = formData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must contain at least 8 characters");
      return;
    }

    if (currentPassword === newPassword) {
      toast.error("New password must be different from current password");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const response = await api.post(
        "/change-password",
        {
          currentPassword,
          newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.status) {
        toast.success(
          response.data.message || "Password changed successfully!"
        );

        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        setShowPassword({
          current: false,
          new: false,
          confirm: false,
        });
      } else {
        toast.error(response.data.message || "Unable to change password");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const passwordRequirements = [
    {
      label: "At least 8 characters",
      valid: formData.newPassword.length >= 8,
    },
    {
      label: "Different from current password",
      valid:
        formData.newPassword.length > 0 &&
        formData.newPassword !== formData.currentPassword,
    },
    {
      label: "Both new passwords match",
      valid:
        formData.confirmPassword.length > 0 &&
        formData.newPassword === formData.confirmPassword,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f5f7ff] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Page Heading */}
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm">
            <Sparkles size={14} />
            ACCOUNT SETTINGS
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Settings
          </h1>

          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Manage your account security and keep your information protected.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
          {/* Change Password Card */}
          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_15px_50px_rgba(30,41,59,0.06)]">
            {/* Card Header */}
            <div className="border-b border-slate-100 px-6 py-6 sm:px-8">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <LockKeyhole size={23} />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Change Password
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Update your password to secure your account.
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-6 px-6 py-7 sm:px-8"
            >
              <PasswordField
                label="Current Password"
                name="currentPassword"
                placeholder="Enter your current password"
                visible={showPassword.current}
                toggle={() => togglePassword("current")}
                icon={LockKeyhole}
                value={formData.currentPassword}
                onChange={handleChange}
                autoComplete="current-password"
              />

              <div className="border-t border-slate-100" />

              <PasswordField
                label="New Password"
                name="newPassword"
                placeholder="Enter your new password"
                visible={showPassword.new}
                toggle={() => togglePassword("new")}
                icon={KeyRound}
                value={formData.newPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />

              <PasswordField
                label="Confirm New Password"
                name="confirmPassword"
                placeholder="Re-enter your new password"
                visible={showPassword.confirm}
                toggle={() => togglePassword("confirm")}
                icon={ShieldCheck}
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
              />

              {/* Password Requirements */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <ShieldCheck size={18} className="text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-800">
                    Password requirements
                  </h3>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {passwordRequirements.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-2"
                    >
                      {item.valid ? (
                        <CheckCircle2
                          size={16}
                          className="shrink-0 text-emerald-500"
                        />
                      ) : (
                        <AlertCircle
                          size={16}
                          className="shrink-0 text-slate-400"
                        />
                      )}

                      <span
                        className={`text-xs ${
                          item.valid
                            ? "font-medium text-emerald-700"
                            : "text-slate-500"
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-400">
                  Your password is securely encrypted before saving.
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-200 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Updating...
                    </>
                  ) : (
                    <>
                      Update Password
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Security Information */}
          <div className="space-y-5">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-6 text-white shadow-xl shadow-indigo-200">
              <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-violet-300/20 blur-2xl" />

              <div className="relative">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                  <ShieldCheck size={25} />
                </div>

                <h3 className="text-xl font-bold">
                  Your security matters
                </h3>

                <p className="mt-3 text-sm leading-6 text-indigo-100">
                  Keep your account safe by choosing a strong password that
                  you don't use on other websites.
                </p>

                <div className="mt-6 flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 p-3">
                  <LockKeyhole size={17} />
                  <span className="text-xs font-medium">
                    Secure account protection
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-bold text-slate-800">
                Security tips
              </h3>

              <ul className="mt-4 space-y-4">
                {[
                  "Avoid using personal information in passwords.",
                  "Never share your password with anyone.",
                  "Use a unique password for your account.",
                ].map((tip, index) => (
                  <li key={index} className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-600">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-5 text-slate-500">
                      {tip}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

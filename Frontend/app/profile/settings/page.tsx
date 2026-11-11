
"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  Bell,
  Mail,
  CalendarDays,
  MessageCircle,
  AlertTriangle
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/src/lib/axios";
import ProfileSidebar from "@/components/profile/ProfileSidebar";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

type PasswordFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  toggle: () => void;
  placeholder: string;
};

type NotificationPreferences = {
  emailNotifications: boolean;
  appointmentNotifications: boolean;
  counsellingNotifications: boolean;
};

type NotificationKey = keyof NotificationPreferences;

function PasswordField({
  label,
  value,
  onChange,
  show,
  toggle,
  placeholder,
}: PasswordFieldProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClass}
          autoComplete="off"
        />

        <button
          type="button"
          onClick={toggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={19} /> : <Eye size={19} />}
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();

const [deactivationPassword, setDeactivationPassword] = useState("");
const [showDeactivationPassword, setShowDeactivationPassword] =
  useState(false);
const [deactivationLoading, setDeactivationLoading] = useState(false);
const [showDeactivationForm, setShowDeactivationForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // ================= NOTIFICATION PREFERENCES =================

  const [preferences, setPreferences] =
    useState<NotificationPreferences>({
      emailNotifications: true,
      appointmentNotifications: true,
      counsellingNotifications: true,
    });

  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [savingPreference, setSavingPreference] =
    useState<NotificationKey | null>(null);

  useEffect(() => {
    const fetchNotificationPreferences = async () => {
      try {
        const response = await api.get("/notification-preferences");

        if (response.data?.status && response.data?.data) {
          setPreferences({
            emailNotifications:
              response.data.data.emailNotifications,
            appointmentNotifications:
              response.data.data.appointmentNotifications,
            counsellingNotifications:
              response.data.data.counsellingNotifications,
          });
        }
      } catch (error: any) {
        toast.error(
          error.response?.data?.message ||
            "Unable to load notification preferences."
        );
      } finally {
        setPreferencesLoading(false);
      }
    };

    fetchNotificationPreferences();
  }, []);

  // ================= UPDATE NOTIFICATION PREFERENCE =================

  const handleNotificationToggle = async (
    key: NotificationKey,
    value: boolean
  ) => {
    if (savingPreference) return;

    try {
      setSavingPreference(key);

      const response = await api.put("/notification-preferences", {
        [key]: value,
      });

      if (response.data?.status) {
        setPreferences((prev) => ({
          ...prev,
          [key]: value,
        }));

        toast.success(
          response.data.message ||
            "Notification preference updated successfully."
        );
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Unable to update notification preference."
      );
    } finally {
      setSavingPreference(null);
    }
  };

  // ================= CHANGE PASSWORD =================

  const handleChangePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please complete all required fields.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Your new password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(
        "The new password and confirmation password do not match."
      );
      return;
    }

    if (currentPassword === newPassword) {
      toast.error(
        "Please choose a new password different from your current password."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/change-password", {
        currentPassword,
        newPassword,
      });

      toast.success(
        response.data?.message ||
          "Your password has been changed successfully."
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      const status = error.response?.status;
      const backendMessage = error.response?.data?.message;

      if (status === 401 || status === 400) {
        toast.error(
          backendMessage ||
            "The current password is incorrect or the password details are invalid."
        );
      } else if (status >= 500) {
        toast.error(
          "We're experiencing a server issue. Please try again later."
        );
      } else {
        toast.error(
          backendMessage ||
            "We couldn't update your password. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ================= DEACTIVATE ACCOUNT =================

const handleDeactivateAccount = async (
  e: FormEvent<HTMLFormElement>
) => {
  e.preventDefault();

  if (!deactivationPassword.trim()) {
    toast.error("Please enter your current password.");
    return;
  }

  try {
    setDeactivationLoading(true);

    const response = await api.post(
      "/studentProfile/deactivate-account",
      {
        password: deactivationPassword,
      }
    );

    if (response.data?.status) {
      // Clear stored authentication data
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      toast.success(
        response.data.message ||
          "Your account has been deactivated successfully."
      );

      setDeactivationPassword("");

      // Redirect to public home page
      router.replace("/");
    }
  } catch (error: any) {
    toast.error(
      error.response?.data?.message ||
        "Unable to deactivate your account. Please try again."
    );
  } finally {
    setDeactivationLoading(false);
  }
};

  // ================= NOTIFICATION ROW =================

  const notificationItems = [
    {
      key: "emailNotifications" as const,
      title: "Email Notifications",
      description: "Receive important account updates through email.",
      icon: Mail,
    },
    {
      key: "appointmentNotifications" as const,
      title: "Appointment Notifications",
      description: "Receive appointment confirmations, updates and reminders.",
      icon: CalendarDays,
    },
    {
      key: "counsellingNotifications" as const,
      title: "Counselling Notifications",
      description: "Receive updates about counselling requests and sessions.",
      icon: MessageCircle,
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="hidden lg:block">
        <ProfileSidebar />
      </div>

      <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <p className="text-sm font-semibold text-indigo-600">
              Student Profile
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              Settings
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage your account security and notification preferences.
            </p>
          </div>

          {/* ================= CHANGE PASSWORD ================= */}

          <section className="mb-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                <LockKeyhole size={22} />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Change Password
                </h2>
                <p className="text-xs text-slate-500">
                  Keep your account secure by updating your password.
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-5 p-6">
              <PasswordField
                label="Current Password"
                value={currentPassword}
                onChange={setCurrentPassword}
                show={showCurrent}
                toggle={() => setShowCurrent(!showCurrent)}
                placeholder="Enter your current password"
              />

              <PasswordField
                label="New Password"
                value={newPassword}
                onChange={setNewPassword}
                show={showNew}
                toggle={() => setShowNew(!showNew)}
                placeholder="Enter your new password"
              />

              <PasswordField
                label="Confirm New Password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                show={showConfirm}
                toggle={() => setShowConfirm(!showConfirm)}
                placeholder="Re-enter your new password"
              />

              <div className="flex items-start gap-2 rounded-xl bg-indigo-50 p-4 text-sm text-indigo-700">
                <ShieldCheck size={19} className="mt-0.5 shrink-0" />
                <p>
                  For your security, please use a password containing at
                  least 8 characters.
                </p>
              </div>

              <div className="flex justify-end border-t border-slate-100 pt-5">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Updating Password..." : "Change Password"}
                </button>
              </div>
            </form>
          </section>

          {/* ================= NOTIFICATION PREFERENCES ================= */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                <Bell size={22} />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Notification Preferences
                </h2>
                <p className="text-xs text-slate-500">
                  Choose which notifications you want to receive.
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 px-6">
              {preferencesLoading ? (
                <div className="py-10 text-center text-sm text-slate-500">
                  Loading notification preferences...
                </div>
              ) : (
                notificationItems.map((item) => {
                  const Icon = item.icon;
                  const enabled = preferences[item.key];
                  const isSaving = savingPreference === item.key;

                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between gap-4 py-5"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                          <Icon size={20} />
                        </div>

                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-slate-800">
                            {item.title}
                          </h3>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={enabled}
                        aria-label={item.title}
                        disabled={savingPreference !== null}
                        onClick={() =>
                          handleNotificationToggle(item.key, !enabled)
                        }
                        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                          enabled ? "bg-green-600" : "bg-gray-800"
                        }`}
                      >
                        <span
                          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                            enabled ? "translate-x-1" : "translate-x-1"
                          }`}
                        />
                      </button>

                      {isSaving && (
                        <span className="sr-only">Saving preference...</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
              <p className="text-xs text-slate-500">
                Your preferences are saved automatically when you change a
                setting.
              </p>
            </div>
          </section>

          
{/* ================= ACCOUNT DEACTIVATION ================= */}

<section className="mt-7 overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
  <div className="flex items-center gap-3 border-b border-red-100 px-6 py-5">
    <div className="grid h-11 w-11 place-items-center rounded-xl bg-red-50 text-red-600">
      <AlertTriangle size={22} />
    </div>

    <div>
      <h2 className="font-bold text-slate-900">
        Deactivate Account
      </h2>
      <p className="text-xs text-slate-500">
        Temporarily restrict access to your student account.
      </p>
    </div>
  </div>

  <div className="space-y-4 p-6">
    <div className="rounded-xl border border-red-100 bg-red-50 p-4">
      <p className="text-sm font-semibold text-red-800">
        Important Information
      </p>
      <p className="mt-2 text-sm leading-6 text-red-700">
        Deactivating your account will restrict access to
        student services. You will not be able to log in
        while your account remains deactivated. Contact
        support for assistance.
      </p>
    </div>

    {!showDeactivationForm ? (
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowDeactivationForm(true)}
          className="rounded-xl border border-red-200 bg-white px-6 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
        >
          Deactivate My Account
        </button>
      </div>
    ) : (
      <form
        onSubmit={handleDeactivateAccount}
        className="space-y-5"
      >
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Confirm Your Password
          </label>

          <div className="relative">
            <input
              type={showDeactivationPassword ? "text" : "password"}
              value={deactivationPassword}
              onChange={(e) =>
                setDeactivationPassword(e.target.value)
              }
              placeholder="Enter your current password"
              className={inputClass}
              autoComplete="current-password"
            />

            <button
              type="button"
              onClick={() =>
                setShowDeactivationPassword(
                  !showDeactivationPassword
                )
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
              aria-label={
                showDeactivationPassword
                  ? "Hide password"
                  : "Show password"
              }
            >
              {showDeactivationPassword ? (
                <EyeOff size={19} />
              ) : (
                <Eye size={19} />
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
          <button
            type="button"
            disabled={deactivationLoading}
            onClick={() => {
              setShowDeactivationForm(false);
              setDeactivationPassword("");
            }}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={deactivationLoading}
            className="rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deactivationLoading
              ? "Deactivating..."
              : "Confirm Deactivation"}
          </button>
        </div>
      </form>
    )}
  </div>
</section>

        </div>

        
      </main>
    </div>
  );
}

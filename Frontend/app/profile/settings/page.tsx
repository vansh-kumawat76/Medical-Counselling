
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
  AlertTriangle,
  Monitor,
Clock3,
MapPin,
RefreshCw,
LogOut,
Laptop,
  Sun,
  Moon,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "@/src/lib/axios";

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
type ActiveSession = {
  _id: string;
  sessionId: string;
  device: string;
  browser: string;
  os: string;
  ipAddress: string;
  loginAt: string;
  lastActiveAt: string;
  expiresAt: string;
  isCurrent: boolean;
};

type AppearanceTheme = "light" | "dark" | "system";

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
// ================= APPEARANCE SETTINGS =================

const [appearanceTheme, setAppearanceTheme] =
  useState<AppearanceTheme>("system");

const [themeLoaded, setThemeLoaded] = useState(false);
  // ================= ACCOUNT SECURITY =================

const [accountSecurity, setAccountSecurity] =
  useState<AccountSecurity | null>(null);

const [accountSecurityLoading, setAccountSecurityLoading] =
  useState(true);

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

  // ================= ACTIVE SESSIONS =================

const [sessions, setSessions] = useState<ActiveSession[]>([]);
const [sessionsLoading, setSessionsLoading] = useState(true);
const [sessionActionLoading, setSessionActionLoading] = useState<string | null>(null);
const [logoutOthersLoading, setLogoutOthersLoading] = useState(false);
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

  // ================= FETCH ACCOUNT SECURITY =================

useEffect(() => {
  const fetchAccountSecurity = async () => {
    try {
      const response = await api.get(
        "/studentProfile/account-security"
      );

      if (response.data?.status) {
        setAccountSecurity(response.data.data);
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          "Unable to load account security information."
      );
    } finally {
      setAccountSecurityLoading(false);
    }
  };

  fetchAccountSecurity();
}, []);

  // ================= FETCH ACTIVE SESSIONS =================

const fetchActiveSessions = async () => {
  try {
    setSessionsLoading(true);

    const response = await api.get("/studentProfile/active-sessions");

    if (response.data?.status) {
      setSessions(response.data.data || []);
    }
  } catch (error: any) {
    toast.error(
      error.response?.data?.message ||
        "Unable to load active sessions."
    );
  } finally {
    setSessionsLoading(false);
  }
};

useEffect(() => {
  fetchActiveSessions();
}, []);

// ================= LOAD APPEARANCE THEME =================

useEffect(() => {
  const savedTheme = localStorage.getItem("appearanceTheme");

  if (
    savedTheme === "light" ||
    savedTheme === "dark" ||
    savedTheme === "system"
  ) {
    setAppearanceTheme(savedTheme);
  }

  setThemeLoaded(true);
}, []);

// ================= APPLY APPEARANCE THEME =================

useEffect(() => {
  if (!themeLoaded) return;

  const root = document.documentElement;
  const mediaQuery = window.matchMedia(
    "(prefers-color-scheme: dark)"
  );

  const applyTheme = () => {
    const isDark =
      appearanceTheme === "dark" ||
      (appearanceTheme === "system" && mediaQuery.matches);

    root.classList.toggle("dark", isDark);
  };

  localStorage.setItem("appearanceTheme", appearanceTheme);

  applyTheme();

  if (appearanceTheme === "system") {
    mediaQuery.addEventListener("change", applyTheme);
  }

  return () => {
    mediaQuery.removeEventListener("change", applyTheme);
  };
}, [appearanceTheme, themeLoaded]);

// ================= CHANGE APPEARANCE THEME =================

const handleThemeChange = (theme: AppearanceTheme) => {
  setAppearanceTheme(theme);
  toast.success("Appearance preference updated.");
};
// ================= TERMINATE SESSION =================

const handleTerminateSession = async (session: ActiveSession) => {
  const confirmed = window.confirm(
    session.isCurrent
      ? "Are you sure you want to log out from this device?"
      : "Are you sure you want to log out this device?"
  );

  if (!confirmed) return;

  try {
    setSessionActionLoading(session.sessionId);

    const response = await api.delete(
      `/studentProfile/active-sessions/${session.sessionId}`
    );

    if (response.data?.status) {
      toast.success(
        response.data.message || "Session terminated successfully."
      );

      if (session.isCurrent) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.replace("/");
        return;
      }

      await fetchActiveSessions();
    }
  } catch (error: any) {
    toast.error(
      error.response?.data?.message ||
        "Unable to terminate this session."
    );
  } finally {
    setSessionActionLoading(null);
  }
};

// ================= LOGOUT OTHER SESSIONS =================

const handleLogoutOtherSessions = async () => {
  const otherSessions = sessions.filter((session) => !session.isCurrent);

  if (otherSessions.length === 0) {
    toast.error("There are no other active sessions.");
    return;
  }

  const confirmed = window.confirm(
    `Are you sure you want to log out from ${otherSessions.length} other session(s)?`
  );

  if (!confirmed) return;

  try {
    setLogoutOthersLoading(true);

    const response = await api.post(
      "/studentProfile/active-sessions/logout-others"
    );

    if (response.data?.status) {
      toast.success(
        response.data.message || "Other sessions logged out successfully."
      );

      await fetchActiveSessions();
    }
  } catch (error: any) {
    toast.error(
      error.response?.data?.message ||
        "Unable to log out other sessions."
    );
  } finally {
    setLogoutOthersLoading(false);
  }
};

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
    <div className="flex min-h-screen w-full flex-col overflow-y-auto bg-slate-50">
      <div className="hidden lg:block">
      </div>

     <main className="min-h-screen min-w-0 flex-1 overflow-y-visible px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <p className="text-sm font-semibold text-indigo-600">
              Student Profile
            </p>

            <h1 className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Settings
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage your account security and notification preferences.
            </p>
          </div>

{/* ================= APPEARANCE SETTINGS ================= */}

<section className="mb-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm
dark:border-slate-700 dark:bg-slate-900">
  <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
    <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
      <Sun size={22} />
    </div>

    <div>
      <h2 className="font-bold text-slate-900">
        Appearance Settings
      </h2>
      <p className="text-xs text-slate-500">
        Customize how your student portal looks.
      </p>
    </div>
  </div>

  <div className="grid gap-4 p-6 sm:grid-cols-3">
    {[
      {
        value: "light" as const,
        label: "Light",
        description: "Use light appearance",
        icon: Sun,
      },
      {
        value: "dark" as const,
        label: "Dark",
        description: "Use dark appearance",
        icon: Moon,
      },
      {
        value: "system" as const,
        label: "System Default",
        description: "Follow device settings",
        icon: Monitor,
      },
    ].map((item) => {
      const Icon = item.icon;
      const selected = appearanceTheme === item.value;

      return (
        <button
          key={item.value}
          type="button"
          disabled={!themeLoaded}
          onClick={() => handleThemeChange(item.value)}
          aria-pressed={selected}
          className={`rounded-xl border p-5 text-left transition ${
            selected
              ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/10 dark:bg-indigo-950 dark:ring-indigo-400/20"
              : "border-slate-200 bg-white hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-indigo-400"
          }`}
        >
          <div className="flex items-center justify-between">
            <Icon
              size={24}
              className={
                selected ? "text-indigo-600" : "text-slate-500"
              }
            />

            {selected && (
              <span className="rounded-full bg-indigo-600 px-2 py-1 text-xs font-semibold text-white">
                Selected
              </span>
            )}
          </div>

          <h3 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
            {item.label}
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            {item.description}
          </p>
        </button>
      );
    })}
  </div>
</section>

          {/* ================= ACCOUNT SECURITY INFORMATION ================= */}

<section className="mb-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
  <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
    <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
      <ShieldCheck size={22} />
    </div>

    <div>
      <h2 className="font-bold text-slate-900">
        Account Security Information
      </h2>
      <p className="text-xs text-slate-500">
        View your account details and security activity.
      </p>
    </div>
  </div>

  <div className="p-6">
    {accountSecurityLoading ? (
      <div className="py-8 text-center text-sm text-slate-500">
        Loading account security information...
      </div>
    ) : accountSecurity ? (
      <div className="divide-y divide-slate-100">
        {[
          {
            label: "Email Address",
            value: accountSecurity.email,
          },
          {
            label: "Account Type",
            value: accountSecurity.role || accountSecurity.accountType,
          },
          {
            label: "Account Status",
            value: accountSecurity.accountStatus,
          },
          {
            label: "Account Created",
            value: accountSecurity.accountCreatedAt
              ? new Date(accountSecurity.accountCreatedAt).toLocaleString("en-IN")
              : "Date not available",
          },
          {
            label: "Last Login",
            value: accountSecurity.lastLoginAt
              ? new Date(accountSecurity.lastLoginAt).toLocaleString("en-IN")
              : "Not available",
          },
          {
            label: "Last Password Change",
            value: accountSecurity.passwordChangedAt
              ? new Date(accountSecurity.passwordChangedAt).toLocaleString("en-IN")
              : "Not available",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="flex flex-wrap items-center justify-between gap-2 py-4"
          >
            <span className="text-sm text-slate-500">
              {item.label}
            </span>

            <span className="break-all text-sm font-semibold text-slate-800">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    ) : (
      <div className="py-8 text-center text-sm text-slate-500">
        Account security information is currently unavailable.
      </div>
    )}
  </div>
</section>

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

      {/* ================= ACTIVE SESSIONS ================= */}

<section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
    <div className="flex items-center gap-3">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
        <Monitor size={22} />
      </div>

      <div>
        <h2 className="font-bold text-slate-900">
          Active Sessions
        </h2>
        <p className="text-xs text-slate-500">
          Manage devices where your account is currently logged in.
        </p>
      </div>
    </div>

    <button
      type="button"
      onClick={fetchActiveSessions}
      disabled={sessionsLoading}
      className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
    >
      <RefreshCw
        size={16}
        className={sessionsLoading ? "animate-spin" : ""}
      />
      Refresh
    </button>
  </div>

  <div className="p-6">
    {sessionsLoading ? (
      <div className="py-10 text-center text-sm text-slate-500">
        Loading active sessions...
      </div>
    ) : sessions.length === 0 ? (
      <div className="py-10 text-center text-sm text-slate-500">
        No active sessions found.
      </div>
    ) : (
      <div className="space-y-4">
        {sessions.map((session) => (
          <div
            key={session.sessionId}
            className={`rounded-xl border p-5 ${
              session.isCurrent
                ? "border-indigo-200 bg-indigo-50/40"
                : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                  <Laptop size={23} />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-900">
                      {session.device || "Unknown Device"}
                    </h3>

                    {session.isCurrent && (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        Current Session
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-slate-600">
                    {session.browser} · {session.os}
                  </p>

                  <div className="mt-3 space-y-2 text-xs text-slate-500">
                    <p className="flex items-center gap-2">
                      <MapPin size={14} />
                      IP Address: {session.ipAddress || "Unknown"}
                    </p>

                    <p className="flex items-center gap-2">
                      <Clock3 size={14} />
                      Login:{" "}
                      {new Date(session.loginAt).toLocaleString()}
                    </p>

                    <p className="flex items-center gap-2">
                      <Clock3 size={14} />
                      Last Active:{" "}
                      {new Date(session.lastActiveAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleTerminateSession(session)}
                disabled={
                  sessionActionLoading !== null ||
                  logoutOthersLoading
                }
                className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LogOut size={16} />
                {sessionActionLoading === session.sessionId
                  ? "Logging out..."
                  : "Logout"}
              </button>
            </div>
          </div>
        ))}
      </div>
    )}

    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
      <p className="text-xs text-slate-500">
        Total active sessions: {sessions.length}
      </p>

      <button
        type="button"
        onClick={handleLogoutOtherSessions}
        disabled={
          logoutOthersLoading ||
          sessionActionLoading !== null ||
          sessionsLoading ||
          !sessions.some((session) => !session.isCurrent)
        }
        className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <LogOut size={16} />
        {logoutOthersLoading
          ? "Logging out..."
          : "Logout All Other Sessions"}
      </button>
    </div>
  </div>
</section>
        </div>

        
      </main>
    </div>
  );
}


import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import api from "./Api/axios";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const statusStyle = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-slate-100 text-slate-700",
  pending: "bg-orange-100 text-orange-700",
};

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalStudents: 0,
      activeStudents: 0,
      inactiveStudents: 0,
      pendingStudents: 0,
    },
    growth: {
      currentMonthStudents: 0,
      previousMonthStudents: 0,
      growthPercentage: null,
      growthDirection: "neutral",
    },
    recentStudents: [],
    monthlyRegistrations: [],
    recentActivities: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/student/dashboard-overview");

      if (response.data.status) {
        setDashboardData(response.data.data);
      } else {
        setError("Unable to load dashboard data.");
      }
    } catch (err) {
      console.error("Dashboard API Error:", err);
      setError(err.response?.data?.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const {
    totalStudents,
    activeStudents,
    inactiveStudents,
    pendingStudents,
  } = dashboardData.stats;

  const getPercentage = (value) => {
    if (!totalStudents) return 0;
    return Math.round((value / totalStudents) * 100);
  };

  const growth = dashboardData.growth;

  const growthLabel =
    growth.growthDirection === "new"
      ? "New Registrations"
      : growth.growthDirection === "up"
      ? `+${growth.growthPercentage}% Growth`
      : growth.growthDirection === "down"
      ? `${growth.growthPercentage}% Decline`
      : "No Change";

  const growthColor =
    growth.growthDirection === "up" || growth.growthDirection === "new"
      ? "text-green-600"
      : growth.growthDirection === "down"
      ? "text-red-600"
      : "text-gray-500";

  const formatActivityDate = (date) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const stats = [
    {
      label: "Total Students",
      value: totalStudents,
      note: "All registered students",
      noteColor: "text-blue-600",
      icon: "👨‍🎓",
      iconBg: "bg-blue-100 text-blue-600",
      cardBg: "from-blue-50 to-white",
    },
    {
      label: "Active Students",
      value: activeStudents,
      note: `${getPercentage(activeStudents)}% of total students`,
      noteColor: "text-emerald-600",
      icon: "✓",
      iconBg: "bg-green-100 text-green-600",
      cardBg: "from-green-50 to-white",
    },
    {
      label: "Inactive Students",
      value: inactiveStudents,
      note: `${getPercentage(inactiveStudents)}% of total students`,
      noteColor: "text-slate-600",
      icon: "●",
      iconBg: "bg-slate-100 text-slate-600",
      cardBg: "from-slate-50 to-white",
    },
    {
      label: "Pending Students",
      value: pendingStudents,
      note: pendingStudents > 0 ? "Requires attention" : "All caught up",
      noteColor: pendingStudents > 0 ? "text-orange-600" : "text-emerald-600",
      icon: "!",
      iconBg: "bg-orange-100 text-orange-600",
      cardBg: "from-orange-50 to-white",
    },
  ];

  const overview = [
    {
      label: "Active",
      count: activeStudents,
      percent: getPercentage(activeStudents),
      bar: "bg-green-500",
    },
    {
      label: "Inactive",
      count: inactiveStudents,
      percent: getPercentage(inactiveStudents),
      bar: "bg-slate-500",
    },
    {
      label: "Pending",
      count: pendingStudents,
      percent: getPercentage(pendingStudents),
      bar: "bg-orange-500",
    },
  ];

  const statusDistribution = [
    { name: "Active", value: activeStudents, color: "#22c55e" },
    { name: "Inactive", value: inactiveStudents, color: "#64748b" },
    { name: "Pending", value: pendingStudents, color: "#f97316" },
  ];

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Dashboard Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Welcome back! Here's what's happening with your students.
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm"
        >
          <span className={loading ? "animate-spin" : ""}>↻</span>
          Refresh Data
        </button>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="text-sm font-semibold text-red-700 hover:underline"
          >
            Try Again
          </button>
        </div>
      )}

      {/* STAT CARDS */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.12,
            },
          },
        }}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5"
      >
        {stats.map((item) => (
          <motion.div
            key={item.label}
            variants={{
              hidden: {
                opacity: 0,
                y: 25,
                scale: 0.96,
              },
              visible: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: {
                  duration: 0.5,
                  ease: "easeOut",
                },
              },
            }}
            whileHover={{
              y: -6,
              scale: 1.02,
              transition: { duration: 0.2 },
            }}
            className={`relative overflow-hidden bg-gradient-to-br ${item.cardBg} border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-200`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {item.label}
                </p>

                <h2 className="text-3xl font-bold text-slate-800 mt-3">
                  {loading ? (
                    <span className="inline-block w-16 h-8 bg-slate-200 rounded-md animate-pulse" />
                  ) : (
                    item.value.toLocaleString("en-IN")
                  )}
                </h2>

                <p className={`text-xs font-medium mt-3 ${item.noteColor}`}>
                  {loading ? "Loading..." : item.note}
                </p>
              </div>

              <motion.div
                whileHover={{ rotate: 10, scale: 1.12 }}
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${item.iconBg}`}
              >
                {item.icon}
              </motion.div>
            </div>

            <div className="absolute -right-5 -bottom-8 w-24 h-24 rounded-full bg-white/40" />
          </motion.div>
        ))}
      </motion.div>

      {/* MONTHLY STUDENT REGISTRATIONS */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              Monthly Student Registrations
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              New student registrations over the last 12 months
            </p>
          </div>

          <span className="text-xs font-medium bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full w-fit">
            Last 12 Months
          </span>
        </div>

        <div className="w-full h-72">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-400">
              Loading chart...
            </div>
          ) : dashboardData.monthlyRegistrations?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dashboardData.monthlyRegistrations}
                margin={{ top: 10, right: 10, left: -15, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />

                <XAxis
                  dataKey="month"
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  cursor={{ fill: "#eff6ff" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                  }}
                  formatter={(value) => [`${value} Students`, "Registrations"]}
                  labelFormatter={(label, payload) =>
                    payload?.[0]?.payload?.year
                      ? `${label} ${payload[0].payload.year}`
                      : label
                  }
                />

                <Bar
                  dataKey="total"
                  name="Registrations"
                  fill="#2563eb"
                  radius={[7, 7, 0, 0]}
                  maxBarSize={42}
                  animationDuration={1000}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400">
              No registration data available.
            </div>
          )}
        </div>
      </div>

      {/* STUDENT GROWTH SUMMARY */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Student Growth Summary
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Current month vs previous month registrations
            </p>
          </div>

          <span
            className={`text-sm font-semibold px-3 py-1.5 rounded-full bg-gray-50 ${growthColor}`}
          >
            {growthLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-blue-50 rounded-xl p-5">
            <p className="text-sm text-blue-700 font-medium">
              Current Month Registrations
            </p>
            <h3 className="text-3xl font-bold text-blue-900 mt-2">
              {loading ? "..." : growth.currentMonthStudents}
            </h3>
          </div>

          <div className="bg-gray-50 rounded-xl p-5">
            <p className="text-sm text-gray-600 font-medium">
              Previous Month Registrations
            </p>
            <h3 className="text-3xl font-bold text-gray-800 mt-2">
              {loading ? "..." : growth.previousMonthStudents}
            </h3>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2 text-sm text-gray-500">
          <span className="font-medium">Growth:</span>
          <span className={`font-semibold ${growthColor}`}>
            {growth.growthPercentage === null
              ? "Not available (no previous month registrations)"
              : `${growth.growthPercentage}%`}
          </span>
        </div>
      </motion.div>

      {/* STUDENT STATUS DISTRIBUTION */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-slate-800">
            Student Status Distribution
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Breakdown of students by their current status
          </p>
        </div>

        <div className="h-72 w-full">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-400">
              Loading chart...
            </div>
          ) : totalStudents > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={4}
                  stroke="none"
                  animationDuration={1000}
                >
                  {statusDistribution.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(value, name) => [`${value} Students`, name]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                  }}
                />

                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: "13px", paddingTop: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400">
              No student data available.
            </div>
          )}
        </div>
      </div>

      {/* RECENT ACTIVITY TIMELINE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              Recent Activity
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Latest student registration activities
            </p>
          </div>

          <span className="text-xs font-medium bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full">
            Latest 5
          </span>
        </div>

        <div className="space-y-5">
          {loading ? (
            [1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-4 w-48 bg-slate-200 rounded" />
                  <div className="h-3 w-36 bg-slate-100 rounded" />
                </div>
              </div>
            ))
          ) : dashboardData.recentActivities?.length > 0 ? (
            dashboardData.recentActivities.map((activity, index) => (
              <motion.div
                key={activity._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.08 }}
                className="flex gap-4 relative"
              >
                <div className="relative flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <span className="text-lg">👨‍🎓</span>
                  </div>

                  {index !== dashboardData.recentActivities.length - 1 && (
                    <div className="w-px h-full min-h-8 bg-slate-200 absolute top-10" />
                  )}
                </div>

                <div className="flex-1 pb-2 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">
                    {activity.title}
                  </p>

                  <p className="text-sm text-slate-500 mt-1 break-words">
                    {activity.description}
                  </p>

                  <p className="text-xs text-slate-400 mt-2">
                    {formatActivityDate(activity.createdAt)}
                  </p>
                </div>

                <span className="hidden sm:inline-flex self-start text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                  Registration
                </span>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-10">
              <div className="text-3xl mb-2">📋</div>
              <p className="font-medium text-slate-700">
                No recent activities
              </p>
              <p className="text-sm text-slate-400 mt-1">
                New student registrations will appear here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* TABLE + OVERVIEW */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* RECENT STUDENTS */}
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">
                Recent Students
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Latest registered student records
              </p>
            </div>

            <span className="text-xs font-medium bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full">
              Latest 5
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                <tr>
                  <th className="px-6 py-4 font-semibold">Student</th>
                  <th className="px-6 py-4 font-semibold">Email</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  [1, 2, 3, 4, 5].map((item) => (
                    <tr key={item}>
                      <td className="px-6 py-5">
                        <div className="h-4 w-28 bg-slate-200 rounded animate-pulse" />
                      </td>
                      <td className="px-6 py-5">
                        <div className="h-4 w-36 bg-slate-200 rounded animate-pulse" />
                      </td>
                      <td className="px-6 py-5">
                        <div className="h-6 w-16 bg-slate-200 rounded-full animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : dashboardData.recentStudents.length > 0 ? (
                  dashboardData.recentStudents.map((student) => {
                    const status = (student.status || "pending").toLowerCase();

                    return (
                      <tr
                        key={student._id}
                        className="hover:bg-blue-50/40 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold uppercase">
                              {student.name?.charAt(0) || "S"}
                            </div>

                            <span className="font-medium text-slate-800">
                              {student.name || "Unnamed Student"}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-slate-600">
                          {student.email || "—"}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                              statusStyle[status] ||
                              "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="3"
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      <div className="text-3xl mb-2">👨‍🎓</div>
                      <p className="font-medium text-slate-700">
                        No students found
                      </p>
                      <p className="text-xs mt-1">
                        Student records will appear here.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* QUICK OVERVIEW */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">
                Quick Overview
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Student status distribution
              </p>
            </div>

            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
              ◉
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-slate-500">Total Students</p>
            <h2 className="text-2xl font-bold text-slate-800 mt-1">
              {loading ? "..." : totalStudents.toLocaleString("en-IN")}
            </h2>
          </div>

          <div className="space-y-6">
            {overview.map((item) => (
              <div key={item.label}>
                <div className="flex justify-between items-center text-sm mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.bar}`} />
                    <span className="font-medium text-slate-600">
                      {item.label}
                    </span>
                  </div>

                  <span className="font-semibold text-slate-800">
                    {loading ? "..." : `${item.percent}%`}
                  </span>
                </div>

                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: loading ? "0%" : `${item.percent}%`,
                    }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full ${item.bar}`}
                  />
                </div>

                <p className="text-xs text-slate-400 mt-1.5">
                  {loading
                    ? "Loading..."
                    : `${item.count.toLocaleString("en-IN")} students`}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

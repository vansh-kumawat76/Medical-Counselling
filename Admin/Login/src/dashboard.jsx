import React from "react";

const stats = [
  {
    label: "Total Students",
    value: "1,248",
    note: "+12% this month",
    noteColor: "text-emerald-600",
    icon: "👨‍🎓",
    iconBg: "bg-blue-100 text-blue-600",
  },
  {
    label: "Active Students",
    value: "1,102",
    note: "88% of total",
    noteColor: "text-emerald-600",
    icon: "✓",
    iconBg: "bg-green-100 text-green-600",
  },
  {
    label: "Verified Students",
    value: "956",
    note: "77% of total",
    noteColor: "text-purple-600",
    icon: "★",
    iconBg: "bg-purple-100 text-purple-600",
  },
  {
    label: "Pending",
    value: "146",
    note: "Requires attention",
    noteColor: "text-orange-600",
    icon: "!",
    iconBg: "bg-orange-100 text-orange-600",
  },
];

const recentStudents = [
  { name: "Rahul Sharma", course: "B.Tech CSE", status: "Verified" },
  { name: "Priya Verma", course: "MBA", status: "Pending" },
  { name: "Aman Gupta", course: "B.Com", status: "Active" },
  { name: "Neha Singh", course: "BCA", status: "Verified" },
];

const statusStyle = {
  Verified: "bg-purple-100 text-purple-700",
  Pending: "bg-orange-100 text-orange-700",
  Active: "bg-green-100 text-green-700",
};

const overview = [
  { label: "Active", percent: 88, bar: "bg-green-500" },
  { label: "Verified", percent: 77, bar: "bg-purple-500" },
  { label: "Pending", percent: 12, bar: "bg-orange-500" },
];

const Dashboard = () => {
  return (
    <div className="space-y-6">
      {/* ===== STAT CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((item) => (
          <div
            key={item.label}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {item.label}
                </p>
                <h2 className="text-3xl font-bold text-slate-800 mt-2">
                  {item.value}
                </h2>
                <p className={`text-xs font-medium mt-3 ${item.noteColor}`}>
                  {item.note}
                </p>
              </div>

              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${item.iconBg}`}
              >
                {item.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ===== TABLE + OVERVIEW ===== */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800">
              Recent Students
            </h3>
            <button className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer">
              View all
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Course</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {recentStudents.map((s) => (
                  <tr
                    key={s.name}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {s.name}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{s.course}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyle[s.status]}`}
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Overview */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-5">
            Quick Overview
          </h3>

          <div className="space-y-5">
            {overview.map((o) => (
              <div key={o.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">{o.label}</span>
                  <span className="font-medium text-slate-800">
                    {o.percent}%
                  </span>
                </div>

                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${o.bar}`}
                    style={{ width: `${o.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

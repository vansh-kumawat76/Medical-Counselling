import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

export default function Dashboard() {
  return (
    <div>
      <Sidebar />
      <Header />
      <main className="ml-64 min-h-screen bg-gray-100 p-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Dashboard
        </h1>

        <p className="mt-2 text-gray-600">
          Welcome to Admin Dashboard
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-gray-900">Total Users</h2>
            <p className="mt-2 text-3xl font-bold text-black">120</p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-gray-900">Total HeadCounsil</h2>
            <p className="mt-2 text-3xl font-bold text-black">50</p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-gray-900">Total Orders</h2>
            <p className="mt-2 text-3xl font-bold text-black">350</p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-gray-900">Total Seats</h2>
            <p className="mt-2 text-3xl font-bold text-black">₹5000</p>
          </div>

        </div>
      </main>
    </div>
  );
}
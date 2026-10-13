import React from "react";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-slate-100 flex">


      {/* ================= MAIN ================= */}
      <main className="ml-64 w-[calc(100%-16rem)]">




        {/* ================= CONTENT ================= */}
        <div className="p-8">
           <div>
          <h1 className="text-3xl mb-3 font-bold text-slate-800">
            Dashboard
          </h1>
        
        </div>
          {/* ================= STAT CARDS ================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">

            {/* Total Students */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-slate-500">
                    Total Students
                  </p>

                  <h2 className="text-3xl font-bold text-slate-800 mt-2">
                    1,248
                  </h2>

                </div>

                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-xl">
                  👨‍🎓
                </div>

              </div>

            </div>


            {/* Active */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-slate-500">
                    Active Students
                  </p>

                  <h2 className="text-3xl font-bold text-slate-800 mt-2">
                    1,102
                  </h2>

                  
                </div>

                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-xl text-green-600">
                  ✓
                </div>

              </div>

            </div>


            {/* Verified */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-slate-500">
                    Verified Students
                  </p>

                  <h2 className="text-3xl font-bold text-slate-800 mt-2">
                    956
                  </h2>

                  
                </div>

                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-xl text-purple-600">
                  ✓
                </div>

              </div>

            </div>


            {/* Pending */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-slate-500">
                    Pending
                  </p>

                  <h2 className="text-3xl font-bold text-slate-800 mt-2">
                    146
                  </h2>

                  <p className="text-xs text-orange-600 mt-3">
                    Requires attention
                  </p>
                </div>

                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-xl text-orange-600">
                  !
                </div>

              </div>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
};

export default Dashboard;



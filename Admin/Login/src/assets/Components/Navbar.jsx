import React from 'react'

const Navbar = () => {
  return (
    <div>
                {/* Header */}
        <header className="fixed w-full h-20 bg-gray-800 border-b border-slate-200 px-8 flex items-center justify-between">

          <div>
            <h1 className="text-2xl font-bold text-white text-center ml-64">
              Dashboard
            </h1>

            <p className="text-center ml-70 text-sm text-slate-500 mt-1">
              Welcome back, Admin 👋
            </p>
          </div>

        </header>
    </div>
  )
}

export default Navbar
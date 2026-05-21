'use client'

import Link from 'next/link'

const HomeNavbar = () => {
  return (
    <div className="bg-white fixed w-full z-10 py-4">
      <div className="flex items-center justify-between w-[95%] mx-auto border-b border-gray-300 pb-4">
        {/* Logo */}
        <Link href="/" className="cursor-pointer">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-gray-800">Biz</span>
            <span className="text-2xl font-bold text-blue-500">Flow</span>
          </div>
        </Link>

        {/* Buttons - Desktop */}
        <div className="flex items-center space-x-4">
          <Link
            href="/"
            className="bg-blue-500 text-black lg:w-28 lg:h-10 w-24 h-7 text-sm lg:text-base flex justify-center items-center rounded-md hover:bg-blue-600 transition-colors"
          >
            Login
          </Link>
          <Link
            href="/dashboard/dashboard-overview"
            className="bg-blue-500 text-black lg:w-28 lg:h-10 w-24 h-7 text-sm lg:text-base flex justify-center items-center rounded-md hover:bg-blue-600 transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

export default HomeNavbar

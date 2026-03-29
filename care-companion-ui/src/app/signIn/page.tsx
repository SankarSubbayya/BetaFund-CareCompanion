"use client"

import Link from "next/link"

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 34V22C14 16.477 18.477 12 24 12C29.523 12 34 16.477 34 22V34" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round"/>
            <rect x="20" y="26" width="8" height="10" rx="1" stroke="#6366f1" strokeWidth="2.5"/>
            <path d="M10 34H38" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M18 12L24 6L30 12" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-indigo-500 mb-1">CareCompanion</h1>
        <p className="text-gray-500 mb-8">Voice-first senior care for families</p>

        {/* Role Cards */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <Link href="/patients" className="group border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition text-center">
            <div className="flex justify-center mb-2">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="10" r="4" stroke="#6366f1" strokeWidth="2"/>
                <path d="M8 26C8 21.582 11.582 18 16 18C20.418 18 24 21.582 24 26" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="font-semibold text-gray-800 text-sm">I&apos;m a Patient</div>
            <div className="text-xs text-gray-400 mt-0.5">View my check-ins &amp; meds</div>
          </Link>

          <Link href="/caregiver" className="group border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition text-center">
            <div className="flex justify-center mb-2">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="10" r="3" stroke="#6366f1" strokeWidth="2"/>
                <circle cx="20" cy="10" r="3" stroke="#6366f1" strokeWidth="2"/>
                <path d="M6 26C6 22.134 9.134 19 13 19H19C22.866 19 26 22.134 26 26" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="font-semibold text-gray-800 text-sm">I&apos;m Family</div>
            <div className="text-xs text-gray-400 mt-0.5">Monitor my loved one</div>
          </Link>

          <Link href="/patients" className="group border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition text-center">
            <div className="flex justify-center mb-2">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 8V24" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/>
                <path d="M10 14L16 8L22 14" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 20H22" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="font-semibold text-gray-800 text-sm">I&apos;m a Doctor</div>
            <div className="text-xs text-gray-400 mt-0.5">Review patient records</div>
          </Link>

          <Link href="/caregiver" className="group border border-gray-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-md transition text-center">
            <div className="flex justify-center mb-2">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 12C16 12 13 8 9 8C5.686 8 4 10.686 4 14C4 20 16 26 16 26C16 26 28 20 28 14C28 10.686 26.314 8 23 8C19 8 16 12 16 12Z" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="font-semibold text-gray-800 text-sm">I&apos;m a Caregiver</div>
            <div className="text-xs text-gray-400 mt-0.5">Manage daily care tasks</div>
          </Link>
        </div>

        {/* Admin */}
        <Link href="/caregiver" className="flex items-center justify-center gap-2 w-full border border-gray-200 rounded-xl py-3 hover:border-indigo-300 hover:shadow-md transition">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="#6366f1" strokeWidth="1.5"/>
            <path d="M10 2.5L11.5 4.5L14 4L15 6.5L17.5 7L17 9.5L18.5 11.5L16.5 13L17 15.5L14.5 16L13.5 18.5L11 17.5L10 19.5L9 17.5L6.5 18.5L5.5 16L3 15.5L3.5 13L1.5 11.5L3 9.5L2.5 7L5 6.5L6 4L8.5 4.5L10 2.5Z" stroke="#6366f1" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
          <span className="font-semibold text-gray-700 text-sm">Admin</span>
        </Link>
      </div>
    </div>
  )
}

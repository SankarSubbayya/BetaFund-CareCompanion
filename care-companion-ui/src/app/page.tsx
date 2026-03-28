"use client"

import { signIn, useSession } from "next-auth/react"

export default function Home() {
  const { data: session } = useSession()

  if (session) {
    const email = session.user?.email
    const allowedViews = email === "joshuax47@gmail.com" ? ["Caregiver"] : ["Caregiver", "Patient", "Emergency Contact"]

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <h1 className="text-2xl font-bold mb-4">Welcome, {session.user?.name}</h1>
        <p className="mb-8">Select your view:</p>
        <div className="flex gap-4">
          {["Caregiver", "Patient", "Emergency Contact"].map(view => (
            <button
              key={view}
              className={`px-4 py-2 rounded ${allowedViews.includes(view) ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
              disabled={!allowedViews.includes(view)}
              onClick={() => alert(`Selected ${view}`)}
            >
              {view}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold mb-4">CareCompanion</h1>
      <button
        onClick={() => signIn("google")}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Sign in with Google
      </button>
    </div>
  )
}

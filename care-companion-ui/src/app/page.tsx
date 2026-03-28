"use client"

export default function Home() {
  const allowedViews = ["Caregiver", "Patient", "Emergency Contact"]

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold mb-4">Welcome to CareCompanion</h1>
      <p className="mb-8">Select your view:</p>
      <div className="flex gap-4">
        {allowedViews.map(view => (
          <button
            key={view}
            className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
            onClick={() => alert(`Selected ${view}`)}
          >
            {view}
          </button>
        ))}
      </div>
    </div>
  )
}

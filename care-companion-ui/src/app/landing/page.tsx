"use client"

import { useSession } from "next-auth/react"
import { Navigation } from "@/components/Navigation"
import { HeroCarousel } from "@/components/HeroCarousel"
import { IndustryFacts } from "@/components/IndustryFacts"
import { AgenticAIFeatures } from "@/components/AgenticAIFeatures"
import { CTA } from "@/components/CTA"

export default function LandingPage() {
  const { data: session } = useSession()

  if (session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <h1 className="text-2xl font-bold mb-4">Welcome, {session.user?.name}</h1>
        <p className="mb-8">Select your view:</p>
        <div className="flex gap-4">
          {["Caregiver", "Patient", "Emergency Contact"].map((view) => (
            <button
              key={view}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
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
    <main className="w-full">
      <Navigation />
      <HeroCarousel />
      <IndustryFacts />
      <AgenticAIFeatures />
      <CTA />
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="mb-4">© 2026 CareCompanion. All rights reserved.</p>
          <div className="flex gap-6 justify-center text-sm">
            <a href="#" className="hover:text-blue-400">Privacy</a>
            <a href="#" className="hover:text-blue-400">Terms</a>
            <a href="#" className="hover:text-blue-400">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
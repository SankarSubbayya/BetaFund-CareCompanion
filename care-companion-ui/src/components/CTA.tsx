"use client"

import { useRouter } from "next/navigation"

export function CTA() {
  const router = useRouter()

  return (
    <section id="cta" className="py-16 bg-gradient-to-r from-blue-600 to-blue-400">
      <div className="max-w-4xl mx-auto px-6 text-center text-white">
        <h2 className="text-4xl font-bold mb-4">Ready to Transform Care?</h2>
        <p className="text-xl mb-8 opacity-90">
          Join thousands of elderly individuals and caregivers on CareCompanion
        </p>
        <button
          onClick={() => router.push("/signIn")}
          className="bg-white text-blue-600 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition text-lg"
        >
          Get Started Today
        </button>
      </div>
    </section>
  )
}
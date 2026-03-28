"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const router = useRouter()

  const slides = [
    {
      title: "Healthcare Made Personal",
      subtitle: "Connect with trusted caregivers in minutes",
      description: "CareCompanion bridges elderly individuals with professional healthcare providers for seamless, on-demand care.",
      cta: "Get Started",
      ctaAction: () => router.push("/signIn"),
      bgColor: "from-blue-600 to-blue-400",
    },
    {
      title: "Your Care, Our Priority",
      subtitle: "Professional healthcare at your fingertips",
      description: "Vetted doctors and nurses available 24/7 to provide compassionate care when you need it most.",
      cta: "Learn More",
      ctaAction: () => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" }),
      bgColor: "from-teal-600 to-teal-400",
    },
    {
      title: "AI-Powered Coordination",
      subtitle: "Agentic AI orchestrating care",
      description: "Our intelligent agents coordinate care schedules, manage health records, and optimize caregiver assignments—all seamlessly.",
      cta: "View Agents",
      ctaAction: () => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" }),
      bgColor: "from-purple-600 to-purple-400",
    },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [slides.length])

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      {/* Slides */}
      {slides.map((slide, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 bg-gradient-to-r ${slide.bgColor} transition-opacity duration-1000 ${
            idx === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex items-center justify-center h-full px-6">
            <div className="text-center text-white max-w-2xl">
              <h1 className="text-5xl font-bold mb-4">{slide.title}</h1>
              <p className="text-2xl mb-6 font-light">{slide.subtitle}</p>
              <p className="text-lg mb-8 opacity-90">{slide.description}</p>
              <button
                onClick={slide.ctaAction}
                className="bg-white text-blue-600 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition"
              >
                {slide.cta}
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Dots */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`h-3 w-3 rounded-full transition ${
              idx === currentSlide ? "bg-white" : "bg-gray-400"
            }`}
          />
        ))}
      </div>

      {/* Arrow Navigation */}
      <button
        onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-3xl hover:bg-white/20 p-2 rounded"
      >
        ❮
      </button>
      <button
        onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-3xl hover:bg-white/20 p-2 rounded"
      >
        ❯
      </button>
    </div>
  )
}
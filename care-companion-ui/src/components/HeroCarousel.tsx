"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const router = useRouter()

  const slides = [
    {
      title: "Healthcare Made Personal",
      description: "Connect with trusted caregivers in minutes — on-demand, professional, and close to home.",
      icon: "❤️",
      accent: "text-warm-orange",
      bg: "bg-gradient-to-br from-[#fff3eb] to-[#ffe8d6]",
    },
    {
      title: "Your Care, Our Priority",
      description: "Vetted doctors and nurses available 24/7 to provide compassionate care when you need it most.",
      icon: "🩺",
      accent: "text-warm-blue",
      bg: "bg-gradient-to-br from-[#e8f5fc] to-[#d0ecfa]",
    },
    {
      title: "AI-Powered Coordination",
      description: "Intelligent agents coordinate schedules, manage records, and optimize assignments — seamlessly.",
      icon: "🧠",
      accent: "text-[#8b5cf6]",
      bg: "bg-gradient-to-br from-[#f3f0ff] to-[#ede5ff]",
    },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [slides.length])

  return (
    <>
      {/* Hero */}
      <section className="relative text-center py-20 px-10 max-w-[780px] mx-auto overflow-hidden">
        {/* Beating Heart Background */}
        <svg
          className="pointer-events-none absolute top-1/2 left-1/2 w-[500px] h-[500px] opacity-[0.05]"
          style={{ animation: "heartbeat 1.5s ease-in-out infinite" }}
          viewBox="0 0 24 24"
          fill="#f07b2a"
          aria-hidden="true"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        <div className="inline-flex items-center gap-2 text-[13px] text-warm-orange bg-warm-badge-bg px-[18px] py-[7px] rounded-full mb-7 border border-warm-border">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 12s-5.5-3.5-5.5-7A3.5 3.5 0 0 1 7 2.3 3.5 3.5 0 0 1 12.5 5c0 3.5-5.5 7-5.5 7z" fill="#f07b2a"/>
          </svg>
          Professional Care, Simplified
        </div>

        <h1 className="text-[56px] font-medium leading-[1.1] tracking-[-2px] text-foreground mb-5">
          Where <span className="text-warm-blue">care</span> meets
          <br />
          <span className="text-warm-orange">compassion</span>
        </h1>

        <p className="text-[19px] text-warm-text leading-[1.65] mb-10 max-w-[520px] mx-auto">
          CareCompanion connects elderly patients with trusted caregivers and doctors — making
          professional, personalized care feel like having a friend who truly
          understands.
        </p>

        <button
          onClick={() => router.push("/signIn")}
          className="bg-warm-orange text-white text-base font-medium px-9 py-[15px] rounded-full hover:bg-warm-orange-dark transition cursor-pointer"
        >
          Get started free
        </button>
      </section>

      {/* Carousel */}
      <div className="relative max-w-[900px] mx-auto px-12 pb-16">
        <div className="relative h-[180px] rounded-[24px] overflow-hidden">
          {slides.map((slide, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 ${slide.bg} rounded-[24px] border border-warm-border p-10 flex items-center gap-8 transition-all duration-700 ease-in-out ${
                idx === currentSlide
                  ? "opacity-100 translate-x-0"
                  : idx < currentSlide
                  ? "opacity-0 -translate-x-full"
                  : "opacity-0 translate-x-full"
              }`}
            >
              <span className="text-5xl shrink-0">{slide.icon}</span>
              <div className="text-left">
                <h3 className={`text-xl font-medium mb-2 ${slide.accent}`}>
                  {slide.title}
                </h3>
                <p className="text-[15px] text-warm-text leading-[1.6]">
                  {slide.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentSlide
                  ? "w-6 bg-warm-orange"
                  : "w-2 bg-warm-border hover:bg-warm-text-muted"
              }`}
            />
          ))}
        </div>

        {/* Arrows */}
        <button
          onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
          className="absolute left-2 top-[90px] -translate-y-1/2 w-9 h-9 rounded-full bg-white border border-warm-border flex items-center justify-center text-warm-text-muted hover:border-warm-orange hover:text-warm-orange transition"
        >
          ‹
        </button>
        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
          className="absolute right-2 top-[90px] -translate-y-1/2 w-9 h-9 rounded-full bg-white border border-warm-border flex items-center justify-center text-warm-text-muted hover:border-warm-orange hover:text-warm-orange transition"
        >
          ›
        </button>
      </div>
    </>
  )
}

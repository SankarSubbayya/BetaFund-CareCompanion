"use client"

import { useSession } from "next-auth/react"
import { Navigation } from "@/components/Navigation"
import { HeroCarousel } from "@/components/HeroCarousel"
import { IndustryFacts } from "@/components/IndustryFacts"
import { AgenticAIFeatures } from "@/components/AgenticAIFeatures"
import { CTA } from "@/components/CTA"

export default function Home() {
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
    <main className="w-full bg-warm-bg">
      <Navigation />
      <HeroCarousel />

      {/* Feel Strip */}
      <div className="flex items-center justify-center gap-10 bg-white border-y border-warm-border py-6 px-12 flex-wrap">
        {[
          { emoji: "❤️", label: "Vetted with care", bg: "bg-warm-badge-bg" },
          { emoji: "🏠", label: "Care at home", bg: "bg-warm-blue-bg" },
          { emoji: "🌟", label: "5-star caregivers", bg: "bg-warm-badge-bg" },
          { emoji: "🕐", label: "24/7 available", bg: "bg-warm-blue-bg" },
          { emoji: "🔒", label: "Safe & trusted", bg: "bg-warm-badge-bg" },
        ].map((item, idx) => (
          <div key={idx} className="flex items-center gap-2.5">
            {idx > 0 && (
              <div className="w-px h-7 bg-warm-border mr-7 hidden sm:block" />
            )}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[15px] ${item.bg}`}>
              {item.emoji}
            </div>
            <span className="text-sm font-medium text-warm-text-dark">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Roles Section */}
      <section id="patients" className="pt-16 px-12 max-w-[1000px] mx-auto">
        <div className="text-xs uppercase tracking-widest text-warm-orange mb-3">
          Who we serve
        </div>
        <div className="text-4xl font-medium tracking-tight text-foreground mb-2.5">
          Care for everyone in the family
        </div>
        <p className="text-[17px] text-warm-text mb-8">
          Whether you need care, provide it, or support a loved one — we built
          CareCompanion for you.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[18px]">
          <div className="rounded-[20px] p-8 border border-warm-border bg-white">
            <span className="text-[28px] mb-3.5 block">👴</span>
            <h3 className="text-lg font-medium text-foreground mb-2">For patients</h3>
            <p className="text-sm text-warm-text leading-[1.6]">
              Find a warm, qualified caregiver who fits your life, schedule, and
              needs. Feel supported every single day.
            </p>
            <a href="#" className="inline-block mt-3.5 text-[13px] font-medium text-warm-blue">
              Find care near you →
            </a>
          </div>
          <div id="caregivers" className="rounded-[20px] p-8 border border-warm-border bg-white">
            <span className="text-[28px] mb-3.5 block">🤝</span>
            <h3 className="text-lg font-medium text-foreground mb-2">For caregivers</h3>
            <p className="text-sm text-warm-text leading-[1.6]">
              Build a fulfilling career doing work that matters. Connect with
              patients who need exactly what you offer.
            </p>
            <a href="#" className="inline-block mt-3.5 text-[13px] font-medium text-warm-orange">
              Join our network →
            </a>
          </div>
          <div id="families" className="rounded-[20px] p-8 border border-warm-border bg-white">
            <span className="text-[28px] mb-3.5 block">👨‍👩‍👧</span>
            <h3 className="text-lg font-medium text-foreground mb-2">For families</h3>
            <p className="text-sm text-warm-text leading-[1.6]">
              Stay close to your loved one&apos;s care journey. Real-time updates
              and peace of mind, wherever you are.
            </p>
            <a href="#" className="inline-block mt-3.5 text-[13px] font-medium text-warm-pink">
              Get peace of mind →
            </a>
          </div>
        </div>
      </section>

      <IndustryFacts />
      <AgenticAIFeatures />

      {/* Testimonial */}
      <section className="py-16 px-12 max-w-[800px] mx-auto text-center">
        <span className="text-[64px] text-[#fdd0b0] leading-[0.5] mb-6 block">
          &ldquo;
        </span>
        <blockquote className="text-[22px] font-medium text-foreground leading-[1.45] tracking-tight mb-6">
          CareCompanion gave my mother the care she deserved — and gave our whole
          family peace of mind we didn&apos;t know was possible.
        </blockquote>
        <div className="flex items-center gap-3 justify-center">
          <div className="w-11 h-11 rounded-full bg-warm-badge-bg flex items-center justify-center text-lg">
            👩
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-foreground">Sarah M.</div>
            <div className="text-[13px] text-warm-text-muted">
              Daughter of a CareCompanion patient
            </div>
          </div>
        </div>
      </section>

      <CTA />

      {/* Footer */}
      <footer className="py-7 px-12 flex items-center justify-between border-t border-warm-border bg-white flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <img
            src="/careCompanion-logo.png"
            alt="CareCompanion"
            className="w-7 h-7 object-contain"
          />
          <span className="text-[15px] font-medium">
            <span className="text-warm-blue">Care</span>
            <span className="text-warm-orange">Companion</span>
          </span>
        </div>
        <div className="flex gap-5">
          <a href="#" className="text-[13px] text-warm-text-muted hover:text-warm-orange">
            Privacy Policy
          </a>
          <a href="#" className="text-[13px] text-warm-text-muted hover:text-warm-orange">
            Terms of Service
          </a>
          <a href="#" className="text-[13px] text-warm-text-muted hover:text-warm-orange">
            Contact Us
          </a>
        </div>
        <span className="text-[13px] text-[#b8987a]">
          © 2025 CareCompanion Inc.
        </span>
      </footer>
    </main>
  )
}

"use client"

import Link from "next/link"

export function Navigation() {
  return (
    <nav className="flex items-center justify-between px-12 py-4 bg-white border-b border-warm-border">
      <div className="flex items-center gap-2.5">
        <img
          src="/careCompanion-logo.png"
          alt="CareCompanion logo"
          className="w-[42px] h-[42px] object-contain"
        />
        <div className="text-xl font-medium tracking-tight">
          <span className="text-warm-blue">Care</span>
          <span className="text-warm-orange">Companion</span>
        </div>
      </div>

      <div className="hidden md:flex gap-7">
        <Link href="/patients" className="text-[15px] text-warm-text-muted hover:text-warm-orange transition">
          For Patients
        </Link>
        <Link href="/caregiver" className="text-[15px] text-warm-text-muted hover:text-warm-orange transition">
          For Caregivers
        </Link>
        <a href="#families" className="text-[15px] text-warm-text-muted hover:text-warm-orange transition">
          For Families
        </a>
        <a href="#about" className="text-[15px] text-warm-text-muted hover:text-warm-orange transition">
          About
        </a>
      </div>

      <Link
        href="/signIn"
        className="text-sm font-medium bg-warm-orange text-white px-6 py-2.5 rounded-full hover:bg-warm-orange-dark transition"
      >
        Get started
      </Link>
    </nav>
  )
}

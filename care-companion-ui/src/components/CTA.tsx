"use client"

import { useRouter } from "next/navigation"

export function CTA() {
  const router = useRouter()

  return (
    <section className="mx-12 mb-12 rounded-[28px] py-[60px] px-14 bg-gradient-to-br from-warm-blue to-warm-orange text-center">
      <h2 className="text-[38px] font-medium text-white tracking-tight leading-[1.15] mb-3">
        Ready to find care
        <br />
        that feels like family?
      </h2>
      <p className="text-[17px] text-white/85 mb-8">
        Join thousands of patients and caregivers already on CareCompanion.
      </p>
      <button
        onClick={() => router.push("/signIn")}
        className="bg-white text-warm-orange text-base font-medium px-9 py-[15px] rounded-full hover:bg-[#fff3ee] transition cursor-pointer"
      >
        Get started free
      </button>
    </section>
  )
}

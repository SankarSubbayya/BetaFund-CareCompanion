"use client"

export function AgenticAIFeatures() {
  const features = [
    { icon: "🔍", title: "Smart matching", description: "We pair patients with compatible caregivers based on needs, location, schedule, and personality." },
    { icon: "📅", title: "Easy scheduling", description: "Book and manage appointments without phone calls. Everyone stays in sync automatically." },
    { icon: "📝", title: "Shared care logs", description: "Every visit, note, and update is logged and shared with families so no one is ever left out." },
    { icon: "✅", title: "Verified caregivers", description: "Every caregiver is background-checked, license verified, and reviewed before joining our network." },
    { icon: "🌙", title: "Always on call", description: "Our support team is available 24/7 — because care needs don't follow a 9-to-5 schedule." },
    { icon: "💳", title: "Seamless billing", description: "Invoicing and payments handled automatically — no awkward money conversations ever again." },
  ]

  return (
    <section id="features" className="bg-white py-[72px] px-12 border-t border-warm-border">
      <div className="max-w-[1000px] mx-auto">
        <div className="text-xs uppercase tracking-widest text-warm-orange mb-3">
          How it works
        </div>
        <div className="text-4xl font-medium tracking-tight text-foreground mb-9">
          Simple, warm, and built
          <br />
          for real people
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-[18px]">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="rounded-[18px] p-7 border border-warm-border bg-warm-bg"
            >
              <span className="text-2xl mb-3.5 block">{feature.icon}</span>
              <h3 className="text-[17px] font-medium text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-warm-text leading-[1.55]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

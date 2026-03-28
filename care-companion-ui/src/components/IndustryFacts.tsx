"use client"

export function IndustryFacts() {
  const stats = [
    {
      icon: "👥",
      iconBg: "bg-warm-blue-bg",
      number: "71 Million",
      numberColor: "text-warm-blue",
      description: "Americans aged 65+ by 2030, doubling since 2000 — all deserving quality care and companionship.",
    },
    {
      icon: "📈",
      iconBg: "bg-warm-badge-bg",
      number: "3× Growth",
      numberColor: "text-warm-orange",
      description: "Elderly care services projected to grow 3× faster than average jobs over the next decade.",
    },
    {
      icon: "💛",
      iconBg: "bg-[#fff3e0]",
      number: "$400B Market",
      numberColor: "text-[#c97a10]",
      description: "Global elderly care market expected to surpass $400B by 2027 — an industry ready for transformation.",
    },
    {
      icon: "🏥",
      iconBg: "bg-[#fdeef4]",
      number: "60% Shortage",
      numberColor: "text-warm-pink",
      description: "Healthcare provider shortages affecting 60% of rural communities, leaving real people without help.",
    },
  ]

  return (
    <section id="about" className="py-[72px] px-12 max-w-[1000px] mx-auto">
      <div className="text-xs uppercase tracking-widest text-warm-orange mb-3">
        Why CareCompanion
      </div>
      <div className="text-4xl font-medium tracking-tight text-foreground mb-2.5">
        The need for care is
        <br />
        bigger than ever
      </div>
      <p className="text-[17px] text-warm-text mb-8">
        The elderly care market is growing faster than any industry, and
        technology can bridge the gap between demand and supply.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px]">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white border border-warm-border rounded-[20px] p-8"
          >
            <div className="flex items-center gap-3.5 mb-4">
              <div
                className={`w-11 h-11 rounded-[14px] flex items-center justify-center text-xl shrink-0 ${stat.iconBg}`}
              >
                {stat.icon}
              </div>
              <div className={`text-[34px] font-medium tracking-tight ${stat.numberColor}`}>
                {stat.number}
              </div>
            </div>
            <p className="text-[15px] text-warm-text leading-[1.55]">
              {stat.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

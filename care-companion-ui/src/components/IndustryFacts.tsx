"use client"

export function IndustryFacts() {
  const facts = [
    {
      title: "71 Million",
      description: "Americans aged 65+ by 2030, doubling since 2000",
      icon: "👥",
    },
    {
      title: "3x Growth",
      description: "Elderly care services projected to grow 3x faster than average jobs",
      icon: "📈",
    },
    {
      title: "$400B Market",
      description: "Global elderly care market expected to reach $400B+ by 2027",
      icon: "💰",
    },
    {
      title: "60% Shortage",
      description: "Healthcare provider shortage affecting 60% of rural communities",
      icon: "🏥",
    },
    {
      title: "24/7 Demand",
      description: "Caregiving needs available 24/7, traditional care can't match demand",
      icon: "⏰",
    },
    {
      title: "AI Coordination",
      description: "Agentic AI reduces care coordination time by 70%",
      icon: "🤖",
    },
  ]

  return (
    <section id="about" className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-4">Why CareCompanion</h2>
        <p className="text-center text-gray-600 mb-12 text-lg">
          The elderly care market is growing faster than any industry, and technology can bridge the gap between demand and supply.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {facts.map((fact, idx) => (
            <div
              key={idx}
              className="bg-white p-8 rounded-lg shadow hover:shadow-lg transition"
            >
              <div className="text-4xl mb-4">{fact.icon}</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{fact.title}</h3>
              <p className="text-gray-600">{fact.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
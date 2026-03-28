"use client"

export function AgenticAIFeatures() {
  const features = [
    {
      title: "Intelligent Scheduling",
      description: "AI agents automatically match caregivers with patients based on skills, location, and availability",
      icon: "📅",
    },
    {
      title: "Real-Time Coordination",
      description: "Agents handle schedule changes, cancellations, and emergencies instantly without human intervention",
      icon: "⚡",
    },
    {
      title: "Health Record Management",
      description: "Secure AI-powered management of medical histories, medications, and care preferences",
      icon: "📋",
    },
    {
      title: "Smart Dispatch",
      description: "Agents optimize caregiver routes and assignments to reduce response time and cost",
      icon: "🚗",
    },
    {
      title: "Continuous Learning",
      description: "EverMind.ai stores care patterns and preferences to improve future recommendations",
      icon: "🧠",
    },
    {
      title: "24/7 Support",
      description: "AI agents provide round-the-clock coordination while human caregivers provide actual care",
      icon: "🌙",
    },
  ]

  return (
    <section id="features" className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-4">Agentic AI in Action</h2>
        <p className="text-center text-gray-600 mb-12 text-lg">
          Our AI agents handle coordination while humans provide care
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="p-8 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-lg transition"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
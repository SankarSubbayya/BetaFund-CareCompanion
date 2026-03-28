"use client"

export function Navigation() {
  return (
    <nav className="fixed top-0 w-full bg-white shadow z-50">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src="/careCompanion-logo.png"
            alt="CareCompanion"
            className="h-8 w-8"
          />
          <span className="text-xl font-bold text-gray-900">CareCompanion</span>
        </div>

        <div className="hidden md:flex gap-8">
          <a href="#about" className="text-gray-600 hover:text-blue-600">
            About
          </a>
          <a href="#features" className="text-gray-600 hover:text-blue-600">
            Features
          </a>
          <a href="#cta" className="text-gray-600 hover:text-blue-600">
            Get Started
          </a>
        </div>
      </div>
    </nav>
  )
}
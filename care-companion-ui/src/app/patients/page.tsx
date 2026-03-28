"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/Navigation"

const INSFORGE_BASE = "https://4b7tn66d.us-east.insforge.app"

interface Provider {
  id: string
  name: string
  specialty: string
  credentials: string
  rating: number
  num_reviews: number
  clinic_name: string
  address: string
  city: string
  state: string
  zip: string
  phone: string
  languages: string
  areas_of_interest: string
  accepting_new_patients: boolean
  source: string
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  const empty = 5 - full - (half ? 1 : 0)
  return (
    <span className="flex items-center gap-0.5">
      {Array(full).fill(0).map((_, i) => (
        <span key={`f${i}`} className="text-amber-400">★</span>
      ))}
      {half && <span className="text-amber-400">★</span>}
      {Array(empty).fill(0).map((_, i) => (
        <span key={`e${i}`} className="text-gray-300">★</span>
      ))}
      <span className="ml-1 text-sm text-warm-text-muted">{rating > 0 ? rating.toFixed(1) : "N/A"}</span>
    </span>
  )
}

export default function CaregiverDirectory() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [specialtyFilter, setSpecialtyFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")

  useEffect(() => {
    fetchProviders()
  }, [])

  async function fetchProviders() {
    try {
      const resp = await fetch(`${INSFORGE_BASE}/functions/providers-api`)
      if (!resp.ok) throw new Error("Failed to fetch")
      const data = await resp.json()
      if (Array.isArray(data)) setProviders(data)
    } catch (e) {
      console.error("Could not load providers:", e)
    } finally {
      setLoading(false)
    }
  }

  const specialties = [...new Set(providers.map(p => p.specialty).filter(Boolean))].sort()
  const sources = [...new Set(providers.map(p => p.source).filter(Boolean))].sort()

  const filtered = providers.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.clinic_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.city?.toLowerCase().includes(search.toLowerCase()) ||
      p.specialty?.toLowerCase().includes(search.toLowerCase())
    const matchesSpecialty = specialtyFilter === "all" || p.specialty === specialtyFilter
    const matchesSource = sourceFilter === "all" || p.source === sourceFilter
    return matchesSearch && matchesSpecialty && matchesSource
  })

  const totalProviders = providers.length
  const avgRating = providers.filter(p => p.rating > 0).reduce((a, b) => a + b.rating, 0) / (providers.filter(p => p.rating > 0).length || 1)
  const acceptingNew = providers.filter(p => p.accepting_new_patients).length

  return (
    <div className="min-h-screen bg-warm-bg">
      <Navigation />

      {/* Header */}
      <div className="bg-gradient-to-r from-[#3a9fd4] to-[#2a7fb4] text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <h1 className="text-3xl font-bold mb-2">Bay Area Provider Directory</h1>
          <p className="text-blue-100 text-lg">Find trusted doctors and specialists for your loved ones</p>

          {/* Stats */}
          <div className="flex gap-8 mt-8">
            <div className="bg-white/15 backdrop-blur rounded-xl px-6 py-4">
              <div className="text-3xl font-bold">{totalProviders}</div>
              <div className="text-blue-100 text-sm">Total Providers</div>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-xl px-6 py-4">
              <div className="text-3xl font-bold">{avgRating.toFixed(1)}</div>
              <div className="text-blue-100 text-sm">Avg Rating</div>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-xl px-6 py-4">
              <div className="text-3xl font-bold">{acceptingNew}</div>
              <div className="text-blue-100 text-sm">Accepting Patients</div>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-xl px-6 py-4">
              <div className="text-3xl font-bold">{specialties.length}</div>
              <div className="text-blue-100 text-sm">Specialties</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-warm-border p-5 flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Search by name, clinic, city, or specialty..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-warm-border bg-warm-bg text-sm focus:outline-none focus:ring-2 focus:ring-warm-orange/30 focus:border-warm-orange"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Specialty filter */}
          <select
            className="px-4 py-2.5 rounded-xl border border-warm-border bg-warm-bg text-sm text-warm-text-dark focus:outline-none focus:ring-2 focus:ring-warm-orange/30"
            value={specialtyFilter}
            onChange={e => setSpecialtyFilter(e.target.value)}
          >
            <option value="all">All Specialties</option>
            {specialties.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Source filter */}
          <select
            className="px-4 py-2.5 rounded-xl border border-warm-border bg-warm-bg text-sm text-warm-text-dark focus:outline-none focus:ring-2 focus:ring-warm-orange/30"
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
          >
            <option value="all">All Sources</option>
            {sources.map(s => (
              <option key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</option>
            ))}
          </select>

          {/* View toggle */}
          <div className="flex rounded-xl border border-warm-border overflow-hidden">
            <button
              className={`px-4 py-2.5 text-sm ${viewMode === "grid" ? "bg-warm-orange text-white" : "bg-warm-bg text-warm-text-muted"}`}
              onClick={() => setViewMode("grid")}
            >
              Grid
            </button>
            <button
              className={`px-4 py-2.5 text-sm ${viewMode === "table" ? "bg-warm-orange text-white" : "bg-warm-bg text-warm-text-muted"}`}
              onClick={() => setViewMode("table")}
            >
              Table
            </button>
          </div>

          <span className="text-sm text-warm-text-muted">{filtered.length} results</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        {loading ? (
          <div className="text-center py-20 text-warm-text-muted">Loading providers...</div>
        ) : viewMode === "grid" ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(p => (
              <div key={p.id} className="bg-white rounded-2xl border border-warm-border p-5 hover:shadow-md transition group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-warm-text-dark group-hover:text-warm-orange transition">{p.name}</h3>
                    {p.credentials && <span className="text-xs text-warm-text-muted">{p.credentials}</span>}
                  </div>
                  {p.accepting_new_patients && (
                    <span className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-medium whitespace-nowrap">
                      Accepting
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs bg-warm-badge-bg text-warm-orange px-2.5 py-1 rounded-full font-medium">
                    {p.specialty || "General"}
                  </span>
                  <StarRating rating={p.rating} />
                  {p.num_reviews > 0 && (
                    <span className="text-xs text-warm-text-muted">({p.num_reviews})</span>
                  )}
                </div>

                {p.clinic_name && p.clinic_name !== "Not specified" && (
                  <div className="text-sm text-warm-text-muted mb-1">🏥 {p.clinic_name}</div>
                )}

                {(p.address || p.city) && (
                  <div className="text-sm text-warm-text-muted mb-1">
                    📍 {[p.address, p.city, p.state, p.zip].filter(Boolean).join(", ")}
                  </div>
                )}

                {p.phone && (
                  <div className="text-sm mb-1">
                    📞 <a href={`tel:${p.phone}`} className="text-warm-blue hover:underline">{p.phone}</a>
                  </div>
                )}

                {p.languages && p.languages !== "Not specified" && (
                  <div className="text-xs text-warm-text-muted mt-2">🌐 {p.languages}</div>
                )}

                <div className="mt-3 pt-3 border-t border-warm-border flex items-center justify-between">
                  <span className="text-xs text-warm-text-muted capitalize">
                    {p.source?.replace(/_/g, " ")}
                  </span>
                  {p.phone && (
                    <a
                      href={`tel:${p.phone}`}
                      className="text-xs font-medium bg-warm-orange text-white px-4 py-1.5 rounded-full hover:bg-warm-orange-dark transition"
                    >
                      Call Now
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white rounded-2xl border border-warm-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-warm-bg border-b border-warm-border">
                    <th className="text-left px-5 py-3 font-semibold text-warm-text-dark">Provider</th>
                    <th className="text-left px-5 py-3 font-semibold text-warm-text-dark">Specialty</th>
                    <th className="text-left px-5 py-3 font-semibold text-warm-text-dark">Rating</th>
                    <th className="text-left px-5 py-3 font-semibold text-warm-text-dark">Location</th>
                    <th className="text-left px-5 py-3 font-semibold text-warm-text-dark">Phone</th>
                    <th className="text-left px-5 py-3 font-semibold text-warm-text-dark">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => (
                    <tr key={p.id} className={`border-b border-warm-border/50 hover:bg-warm-bg/50 transition ${i % 2 === 0 ? "" : "bg-warm-bg/30"}`}>
                      <td className="px-5 py-3">
                        <div className="font-medium text-warm-text-dark">{p.name}</div>
                        {p.clinic_name && p.clinic_name !== "Not specified" && (
                          <div className="text-xs text-warm-text-muted">{p.clinic_name}</div>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs bg-warm-badge-bg text-warm-orange px-2 py-0.5 rounded-full">
                          {p.specialty || "General"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <StarRating rating={p.rating} />
                      </td>
                      <td className="px-5 py-3 text-warm-text-muted">
                        {[p.city, p.state].filter(Boolean).join(", ") || p.address?.slice(0, 40)}
                      </td>
                      <td className="px-5 py-3">
                        {p.phone ? (
                          <a href={`tel:${p.phone}`} className="text-warm-blue hover:underline">{p.phone}</a>
                        ) : "—"}
                      </td>
                      <td className="px-5 py-3">
                        {p.accepting_new_patients ? (
                          <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Accepting</span>
                        ) : (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-warm-text-muted">
            No providers match your search. Try adjusting filters.
          </div>
        )}
      </div>
    </div>
  )
}

import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Menu, Search, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { DOCS_NAV, DOCS_FLAT } from '../pages/docsNav'

type DocsShellProps = {
  activeId?: string
  children: ReactNode
}

/**
 * Shared chrome for the documentation area: a persistent, grouped side
 * menu (search-filterable) + top bar, wrapping whichever topic content
 * is passed in as children. This is TamuPay's own docs information
 * architecture (grouped sidebar navigation) rather than the flat
 * card-grid-then-full-width-article pattern this was originally built from.
 */
export function DocsShell({ activeId, children }: DocsShellProps) {
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session)
    })
  }, [])

  useEffect(() => {
    setSidebarOpen(false)
  }, [activeId])

  const q = query.trim().toLowerCase()
  const matches = (title: string) => !q || title.toLowerCase().includes(q)

  const SidebarContent = (
    <nav className="space-y-6 pb-10">
      {DOCS_NAV.map(group => {
        const visibleItems = group.items.filter(item => matches(item.title))
        if (visibleItems.length === 0) return null
        return (
          <div key={group.label}>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {visibleItems.map(item => {
                const isActive = item.id === activeId
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(`/documentation/${item.id}`)}
                    className={`w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all relative ${
                      isActive
                        ? 'bg-red-50 text-red-700'
                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                    }`}
                  >
                    {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-red-600" />}
                    <i className={`${item.icon} text-[11px] w-4 text-center shrink-0`} style={{ color: isActive ? '#dc2626' : undefined }} />
                    <span className="truncate">{item.title}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
      {DOCS_FLAT.every(item => !matches(item.title)) && (
        <p className="px-3 text-xs text-neutral-400">No topics match "{query}".</p>
      )}
    </nav>
  )

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 bg-white border-b border-neutral-200 z-50 shadow-2xs h-14 flex items-center shrink-0">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(o => !o)}
              className="lg:hidden text-neutral-500 hover:text-neutral-800 p-1.5 -ml-1.5"
              aria-label="Toggle documentation menu"
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <img src="/tamu.png" alt="Tamu Pay" className="h-8 object-contain shrink-0" />
            <span className="hidden sm:inline text-xs font-semibold text-neutral-400 border-l border-neutral-200 pl-3">Documentation</span>
          </div>

          <div className="hidden md:flex items-center relative flex-1 max-w-xs">
            <Search size={13} className="absolute left-3 text-neutral-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search documentation..."
              className="w-full bg-neutral-50 border border-neutral-200 rounded-full pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-red-600 transition-colors"
            />
          </div>

          <button
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
            className="btn-secondary text-xs px-3.5 py-1.5 flex items-center gap-1.5 border border-neutral-200 hover:bg-neutral-50 rounded-full shrink-0"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">{isAuthenticated ? 'Go to Dashboard' : 'Sign In'}</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0 w-full max-w-[1440px] mx-auto lg:px-6 xl:px-10">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-neutral-200 bg-white px-3 py-6 overflow-y-auto">
          {SidebarContent}
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-neutral-950/40" onClick={() => setSidebarOpen(false)} />
            <div className="absolute left-0 top-14 bottom-0 w-72 bg-white border-r border-neutral-200 px-3 py-6 overflow-y-auto animate-fade-in">
              <div className="px-3 mb-4 relative">
                <Search size={13} className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search documentation..."
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-full pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-red-600"
                />
              </div>
              {SidebarContent}
            </div>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}

export default DocsShell

import { useNavigate } from 'react-router-dom'
import { DocsShell } from '../components/DocsShell'
import { Reveal } from '../../components/Reveal'

/**
 * Documentation landing page. All topic navigation lives in the DocsShell
 * side menu (grouped, searchable) — this page is intentionally just a
 * welcome/orientation panel, not a second copy of the topic list as cards.
 */
export function Documentation() {
  const navigate = useNavigate()

  return (
    <DocsShell>
      <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center space-y-6">
        <Reveal>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50 px-3 py-1 rounded-full">
            <i className="fa-solid fa-book" /> LapterPay Docs
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight mt-4">
            Everything you need to integrate LapterPay
          </h1>
          <p className="text-sm text-neutral-500 max-w-lg mx-auto leading-relaxed mt-3">
            Pick a topic from the menu on the left, or jump straight into getting started. Every guide includes real
            request/response examples you can copy directly into your codebase.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-6">
            <button
              onClick={() => navigate('/documentation/payments')}
              className="btn-shimmer bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full text-xs font-bold transition-all shadow-sm hover:scale-[1.02]"
            >
              Start with Getting Started
            </button>
            <button
              onClick={() => navigate('/documentation/api')}
              className="bg-white border border-neutral-200 hover:border-neutral-300 text-neutral-800 px-6 py-3 rounded-full text-xs font-bold transition-all"
            >
              Browse API Reference
            </button>
          </div>
        </Reveal>
      </div>
    </DocsShell>
  )
}

export default Documentation

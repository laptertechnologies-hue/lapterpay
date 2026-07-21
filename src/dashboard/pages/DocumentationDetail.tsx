import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { DocsShell } from '../components/DocsShell'
import docsDataJson from './docs_data.json'

interface DocItem {
  id: string
  title: string
  subtitle: string
  htmlContent: string
}

const DOCS_DATA = docsDataJson as Record<string, DocItem>

// Every entry in docs_data.json ships with its own baked-in breadcrumb
// (<nav aria-label="Breadcrumb">Documentation &gt; Topic</nav>) from the
// system this was originally copied from. LapterPay now renders its own
// breadcrumb bar above the content, so strip the embedded one to avoid
// showing two stacked breadcrumbs.
function stripEmbeddedBreadcrumb(html: string): string {
  return html.replace(/<nav\b[^>]*aria-label=["']Breadcrumb["'][^>]*>[\s\S]*?<\/nav>\s*/i, '')
}

export function DocumentationDetail() {
  const { topic: topicName } = useParams<{ topic: string }>()

  const activeTopicId = topicName || 'payments'
  const activeDoc = DOCS_DATA[activeTopicId] || DOCS_DATA.payments
  const cleanedHtml = useMemo(() => stripEmbeddedBreadcrumb(activeDoc.htmlContent), [activeDoc.htmlContent])

  // Delegated click handler on the container to capture clicks on copy buttons
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    const button = target.closest('[data-copy-target]')
    if (button) {
      const textToCopy = button.getAttribute('data-copy-target')
      if (textToCopy) {
        navigator.clipboard.writeText(textToCopy)
        
        // Find copy icon/label element inside
        const originalHtml = button.innerHTML
        button.innerHTML = `<svg class="w-4 h-4 text-emerald-500 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>`
        setTimeout(() => {
          button.innerHTML = originalHtml
        }, 1500)
      }
    }
  }

  return (
    <DocsShell activeId={activeTopicId}>
      {/* Breadcrumb */}
      <div className="border-b border-neutral-200 bg-white px-4 sm:px-6 lg:px-8 py-3">
        <p className="text-[11px] font-semibold text-neutral-400">
          Documentation <i className="fa-solid fa-chevron-right text-[8px] mx-1.5" /> <span className="text-neutral-700">{activeDoc.title}</span>
        </p>
      </div>

      {/* Dynamic HTML Content Render Panel, fades in on topic change */}
      <div
        key={activeTopicId}
        className="animate-fade-in"
        onClick={handleContainerClick}
        dangerouslySetInnerHTML={{ __html: cleanedHtml }}
      />
    </DocsShell>
  )
}
export default DocumentationDetail

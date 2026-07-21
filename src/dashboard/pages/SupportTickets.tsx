import { useState, useEffect } from 'react'
import { FileText, CheckCircle2, X, MessageSquare, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { sanitizeError } from '../../lib/errors'
import { ConfirmDialog } from '../../components/ConfirmDialog'

interface SupportTicket {
  id: string
  subject: string
  priority: 'low' | 'medium' | 'high'
  message: string
  status: 'open' | 'in_progress' | 'resolved'
  created: string
}

export function SupportTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Form states
  const [subject, setSubject] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadTickets() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('support_tickets')
          .select('*')
          .eq('merchant_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        if (data) {
          const formatted = data.map(t => ({
            id: t.id,
            subject: t.subject,
            priority: t.priority as 'low' | 'medium' | 'high',
            message: t.message,
            status: t.status as 'open' | 'in_progress' | 'resolved',
            created: new Date(t.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })
          }))
          setTickets(formatted)
        }
      } catch (err) {
        console.error('Failed to query support tickets:', err)
      } finally {
        setLoading(false)
      }
    }
    loadTickets()
  }, [])

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject || !message) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const ticketId = 'TKT-' + Math.floor(1000 + Math.random() * 9000)
      const { data: newRow, error } = await supabase
        .from('support_tickets')
        .insert({
          id: ticketId,
          merchant_id: user.id,
          subject: subject,
          priority: priority,
          message: message,
          status: 'open'
        })
        .select()
        .single()

      if (error) throw error

      const newTicket: SupportTicket = {
        id: newRow.id,
        subject: newRow.subject,
        priority: newRow.priority as any,
        message: newRow.message,
        status: newRow.status as any,
        created: new Date(newRow.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      }

      setTickets(prev => [newTicket, ...prev])
      setSuccess(true)

      setTimeout(() => {
        setSuccess(false)
        setShowCreateModal(false)
        setSubject('')
        setPriority('medium')
        setMessage('')
        if (window.showToast) {
          window.showToast('Support ticket submitted successfully', 'success')
        }
      }, 1200)
    } catch (err: any) {
      if (window.showToast) window.showToast(sanitizeError(err).userMessage, 'error')
      else alert(sanitizeError(err).userMessage)
    }
  }

  const handleDeleteTrigger = (id: string) => {
    setDeleteId(id)
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteId) return
    setDeleteLoading(true)
    try {
      const { error } = await supabase
        .from('support_tickets')
        .delete()
        .eq('id', deleteId)

      if (error) throw error
      setTickets(prev => prev.filter(t => t.id !== deleteId))
      setShowDeleteConfirm(false)
      setDeleteId(null)
      if (window.showToast) {
        window.showToast('Ticket closed and removed successfully', 'success')
      }
    } catch (err: any) {
      if (window.showToast) window.showToast(sanitizeError(err).userMessage, 'error')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Calculate metrics
  const totalCount = tickets.length
  const openCount = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length
  const resolvedCount = tickets.filter(t => t.status === 'resolved').length

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div>
        <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Support Tickets</h2>
        <p className="text-xs text-neutral-500 mt-1">Get help from our support team.</p>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Total Tickets */}
        <div className="stat-card bg-white border border-neutral-200 p-5 rounded-2xl border-l-4 border-l-brand-500 flex flex-col items-start gap-2.5 shadow-3xs">
          <i className="fa-solid fa-file-lines text-xl text-brand-600"></i>
          <div className="w-full">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500 font-normal">Total Tickets</span>
              <span className="text-[10px] text-neutral-400 font-normal">All time</span>
            </div>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-2xl font-semibold text-neutral-900">{totalCount}</span>
              <span className="text-xs font-normal text-neutral-400">tickets</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Open Tickets */}
        <div className="stat-card bg-white border border-neutral-200 p-5 rounded-2xl border-l-4 border-l-amber-500 flex flex-col items-start gap-2.5 shadow-3xs">
          <i className="fa-solid fa-clock text-xl text-amber-600"></i>
          <div className="w-full">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500 font-normal">Open Tickets</span>
              <span className="text-[10px] text-neutral-400 font-normal">Awaiting</span>
            </div>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-2xl font-semibold text-neutral-900">{openCount}</span>
              <span className="text-xs font-normal text-neutral-400">open</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Resolved */}
        <div className="stat-card bg-white border border-neutral-200 p-5 rounded-2xl border-l-4 border-l-emerald-500 flex flex-col items-start gap-2.5 shadow-3xs">
          <i className="fa-solid fa-circle-check text-xl text-emerald-600"></i>
          <div className="w-full">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500 font-normal">Resolved</span>
              <span className="text-[10px] text-neutral-400 font-normal">Closed</span>
            </div>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-2xl font-semibold text-neutral-900">{resolvedCount}</span>
              <span className="text-xs font-normal text-neutral-400">resolved</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tickets Section Card */}
      <div className="card bg-white p-6 border border-neutral-200/80 rounded-2xl shadow-sm">
        <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4">Recent Tickets</h3>

        {loading ? (
          <div className="py-16 text-center text-xs text-neutral-400">Loading support ticket registry...</div>
        ) : tickets.length === 0 ? (
          <div className="py-16 flex flex-col justify-center items-center text-center px-4">
            <FileText size={28} className="text-neutral-400 mb-3" />
            <h4 className="text-sm font-semibold text-neutral-800">No tickets</h4>
            <p className="text-2xs text-neutral-400 mt-1 max-w-xs">
              Get started by creating a new support ticket.
            </p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="mt-5 flex items-center gap-1.5 px-4 py-2 bg-[#0022a6] hover:bg-[#001c80] text-white rounded-full text-xs font-semibold shadow-sm transition-all cursor-pointer animate-pulse"
            >
              <i className="fa-solid fa-plus text-[10px]"></i>
              New Ticket
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button 
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#0022a6] hover:bg-[#001c80] text-white rounded-full text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                <i className="fa-solid fa-plus text-[10px]"></i>
                New Ticket
              </button>
            </div>
            
            <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-2xl overflow-hidden bg-white">
              {tickets.map((ticket) => (
                <div 
                  key={ticket.id} 
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-neutral-25 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                      <MessageSquare size={16} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-neutral-400">{ticket.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                          ticket.status === 'open' 
                            ? 'bg-amber-50 text-amber-700 border-amber-100' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        }`}>
                          {ticket.status}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${
                          ticket.priority === 'high' 
                            ? 'bg-red-50 text-red-700 border-red-100' 
                            : ticket.priority === 'medium'
                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                            : 'bg-neutral-50 text-neutral-500 border-neutral-200'
                        }`}>
                          {ticket.priority} priority
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-neutral-850">{ticket.subject}</h4>
                      <p className="text-[11px] text-neutral-505 line-clamp-1 max-w-xl">{ticket.message}</p>
                      <div className="text-[9px] text-neutral-400">Created: {ticket.created}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 shrink-0">
                    <button
                      onClick={() => alert(`Replying to ticket ${ticket.id}`)}
                      className="px-3 py-1.5 border border-neutral-300 hover:bg-neutral-50 text-neutral-600 rounded-full text-2xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <MessageSquare size={12} />
                      Reply
                    </button>
                    <button
                      onClick={() => handleDeleteTrigger(ticket.id)}
                      className="p-1.5 border border-red-205 hover:bg-red-50 text-red-600 rounded-full transition-all cursor-pointer"
                      title="Close Ticket"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-neutral-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-200/60 flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-800">Create New Support Ticket</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-neutral-450 hover:text-neutral-650 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateTicket} className="p-6 space-y-4 text-xs">
              {success ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
                  <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                  <div>
                    <h4 className="text-xs font-semibold text-emerald-800">Ticket Opened</h4>
                    <p className="text-2xs text-emerald-600 mt-0.5">
                      Our support team will respond to your ticket as soon as possible.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Subject */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1.5 font-bold">Subject *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g., Settlement Delay help or API Error"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="input"
                    />
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1.5 font-bold">Priority *</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="input bg-white cursor-pointer"
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1.5 font-bold">Detailed Message *</label>
                    <textarea 
                      required
                      rows={4}
                      placeholder="Explain your issue in detail..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="input"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#0022a6] hover:bg-[#001c80] text-white font-bold py-3 rounded-xl shadow transition-all cursor-pointer mt-2"
                  >
                    Open Support Ticket
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      )}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Close Support Ticket"
        message="Are you sure you want to close and remove this support ticket? You will not be able to send further replies."
        confirmText="Close Ticket"
        cancelText="Cancel"
        isDestructive={true}
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}
export default SupportTickets

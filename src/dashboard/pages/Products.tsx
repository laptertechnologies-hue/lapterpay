import { useState, useEffect } from 'react'
import { Search, X, CheckCircle2, Upload, Copy, Check, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { sanitizeError } from '../../lib/errors'
import { ConfirmDialog } from '../../components/ConfirmDialog'

interface Product {
  id: string
  name: string
  description: string
  price: string
  logoUrl?: string
  allowedPayments: {
    mtn: boolean
    airtel: boolean
    card: boolean
  }
  status: string
  createdAt: string
}

export function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [success, setSuccess] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Form states
  const [prodName, setProdName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [mtnUg, setMtnUg] = useState(false)
  const [airtelUg, setAirtelUg] = useState(false)
  const [cardUg, setCardUg] = useState(false)
  const [status, setStatus] = useState('Active')

  useEffect(() => {
    async function loadProducts() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data: prods, error: fetchErr } = await supabase
          .from('products')
          .select('*')
          .eq('merchant_id', user.id)
          .order('created_at', { ascending: false })

        if (!fetchErr && prods) {
          setProducts(prods.map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description || '',
            price: p.price.toString(),
            logoUrl: '',
            allowedPayments: { mtn: true, airtel: true, card: true },
            status: p.status === 'active' ? 'Active' : 'Inactive',
            createdAt: new Date(p.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })
          })))
        }
      }
    }
    loadProducts()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prodName || !price || !userId) return

    const { data: newRow, error: insertErr } = await supabase
      .from('products')
      .insert({
        merchant_id: userId,
        name: prodName,
        description: description,
        price: parseFloat(price),
        status: status === 'Active' ? 'active' : 'inactive'
      })
      .select()
      .single()

    if (insertErr) {
      if (window.showToast) window.showToast(sanitizeError(insertErr).userMessage, 'error')
      return
    }

    const newProduct: Product = {
      id: newRow.id,
      name: newRow.name,
      description: newRow.description || '',
      price: newRow.price.toString(),
      logoUrl: '',
      allowedPayments: {
        mtn: mtnUg,
        airtel: airtelUg,
        card: cardUg
      },
      status: newRow.status === 'active' ? 'Active' : 'Inactive',
      createdAt: new Date(newRow.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    setProducts(prev => [newProduct, ...prev])
    setSuccess(true)

    setTimeout(() => {
      setSuccess(false)
      setShowCreateModal(false)
      setProdName('')
      setDescription('')
      setPrice('')
      setLogoFile(null)
      setMtnUg(false)
      setAirtelUg(false)
      setCardUg(false)
      setStatus('Active')
      if (window.showToast) window.showToast('Product created successfully', 'success')
    }, 1200)
  }

  const handleDeleteTrigger = (id: string) => {
    setDeleteId(id)
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteId) return
    setDeleteLoading(true)
    try {
      const { error: deleteErr } = await supabase
        .from('products')
        .delete()
        .eq('id', deleteId)

      if (deleteErr) throw deleteErr

      setProducts(prev => prev.filter(p => p.id !== deleteId))
      setShowDeleteConfirm(false)
      setDeleteId(null)
      if (window.showToast) window.showToast('Product deleted successfully', 'success')
    } catch (err: any) {
      if (window.showToast) window.showToast(sanitizeError(err).userMessage, 'error')
    } finally {
      setDeleteLoading(false)
    }
  }

  const [copiedProductId, setCopiedProductId] = useState<string | null>(null)

  const handleCopyLink = (id: string) => {
    const link = `https://tamupay.ug/pay/product/${id}`
    navigator.clipboard.writeText(link)
    setCopiedProductId(id)
    if (window.showToast) {
      window.showToast('Payment link copied to clipboard', 'success')
    } else {
      alert(`Payment link copied: ${link}`)
    }
    setTimeout(() => {
      setCopiedProductId(null)
    }, 1500)
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Products</h2>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-xs font-semibold shadow-sm transition-all"
        >
          + Create Product
        </button>
      </div>

      {/* Main Content card */}
      <div className="card bg-white border border-neutral-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Search and filter header */}
        <div className="p-4 border-b border-neutral-100 flex items-center justify-end gap-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
            <input
              type="text"
              className="w-full bg-neutral-50 border border-neutral-200 rounded-full pl-9 pr-4 py-2 text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-brand-200"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs border border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50 bg-white transition-all">
            <i className="fa-solid fa-sliders text-[10px]"></i>
            <span>Filters</span>
            <span className="bg-brand-100 text-brand-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full ml-1">0</span>
          </button>
        </div>

        {/* Empty state body or Product List grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 flex flex-col justify-center items-center text-center">
            <X size={24} className="text-neutral-400 mb-3" />
            <h4 className="text-sm font-semibold text-neutral-800">No products</h4>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-neutral-25">
            {filteredProducts.map((product) => (
              <div 
                key={product.id} 
                className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-xs hover:shadow-sm transition-all flex flex-col"
              >
                {/* Header section with status and image placeholder */}
                <div className="relative h-32 bg-neutral-50 border-b border-neutral-100 flex items-center justify-center p-4">
                  {product.logoUrl ? (
                    <img 
                      src={product.logoUrl} 
                      alt={product.name} 
                      className="max-h-full max-w-full object-contain" 
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-2xs">
                      <i className="fa-solid fa-store text-xl"></i>
                    </div>
                  )}
                  <span className={`absolute top-3 right-3 px-2 py-0.5 rounded text-[9px] font-bold ${
                    product.status === 'Active' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' 
                      : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                  }`}>
                    {product.status}
                  </span>
                </div>

                {/* Info section */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-xs font-bold text-neutral-800 line-clamp-1">{product.name}</h3>
                    <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2 h-7 leading-relaxed">
                      {product.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-neutral-100">
                    {/* Price */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-neutral-450 font-semibold uppercase tracking-wider">Price</span>
                      <span className="text-xs font-black text-neutral-900">
                        UGX {parseInt(product.price).toLocaleString()}
                      </span>
                    </div>

                    {/* Payment Methods */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-neutral-450 font-semibold uppercase tracking-wider">Allowed Channels</span>
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        {product.allowedPayments.mtn && (
                          <span className="bg-amber-50 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-amber-100 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-amber-500"></span> MTN
                          </span>
                        )}
                        {product.allowedPayments.airtel && (
                          <span className="bg-red-50 text-red-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-red-100 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-red-500"></span> Airtel
                          </span>
                        )}
                        {product.allowedPayments.card && (
                          <span className="bg-blue-50 text-blue-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-blue-100 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-blue-500"></span> Card
                          </span>
                        )}
                        {!product.allowedPayments.mtn && !product.allowedPayments.airtel && !product.allowedPayments.card && (
                          <span className="text-neutral-400 text-[9px]">None selected</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-neutral-50 flex items-center justify-between gap-2 px-1">
                    <button 
                      onClick={() => handleCopyLink(product.id)}
                      className="flex items-center gap-1.5 py-1 text-xs text-neutral-400 hover:text-neutral-600 hover:scale-105 transition-all bg-transparent border-0 outline-none"
                      title="Copy Pay Link"
                    >
                      {copiedProductId === product.id ? (
                        <>
                          <Check size={13} className="text-emerald-500" />
                          <span className="text-[10px] text-emerald-500 font-semibold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span className="text-[10px] font-semibold">Copy Link</span>
                        </>
                      )}
                    </button>
                    <button 
                      onClick={() => handleDeleteTrigger(product.id)}
                      className="p-1 text-red-500 hover:text-red-700 hover:scale-110 transition-all bg-transparent border-0 outline-none flex items-center justify-center shrink-0"
                      title="Delete Product"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg my-8 overflow-hidden border border-neutral-100">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-200/60 flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-800">Create Product</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-neutral-400 hover:text-neutral-600">
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {success ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
                  <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                  <div>
                    <h4 className="text-xs font-semibold text-emerald-800">Product Created</h4>
                    <p className="text-2xs text-emerald-600 mt-0.5">Your product has been registered successfully.</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Product Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Premium Plan"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      className="input"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Description (optional)</label>
                    <textarea
                      rows={3}
                      placeholder="Brief description of the product"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="input"
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Price (UGX) *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 50000"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="input"
                    />
                  </div>

                  {/* Image Chooser */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Product Image (optional)</label>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer bg-brand-600 hover:bg-brand-700 text-white rounded-full px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1">
                        <Upload size={14} />
                        Choose File
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setLogoFile(e.target.files[0])
                            }
                          }}
                        />
                      </label>
                      <span className="text-xs text-neutral-500">
                        {logoFile ? logoFile.name : 'No file chosen'}
                      </span>
                    </div>
                  </div>

                  {/* Allowed Payment Services checkbox list */}
                  <div className="space-y-2 border-t border-neutral-100 pt-3">
                    <span className="block text-xs font-bold text-neutral-700">Allowed Payment Services</span>
                    <span className="block text-[10px] text-neutral-450">Select which payment methods customers can use for this product:</span>
                    
                    <div className="space-y-2.5 pt-1 pl-1">
                      {/* MTN */}
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={mtnUg}
                          onChange={(e) => setMtnUg(e.target.checked)}
                          className="rounded border-neutral-300 text-blue-600 focus:ring-blue-600 w-4 h-4"
                        />
                        <div className="w-5 h-5 rounded bg-[#ffcc02] flex items-center justify-center shrink-0 border border-amber-300">
                          <span className="text-[7px] font-black text-neutral-900 leading-none">MTN</span>
                        </div>
                        <span className="text-xs font-semibold text-neutral-700">MTN-UG</span>
                      </label>

                      {/* Airtel */}
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={airtelUg}
                          onChange={(e) => setAirtelUg(e.target.checked)}
                          className="rounded border-neutral-300 text-blue-600 focus:ring-blue-600 w-4 h-4"
                        />
                        <div className="w-5 h-5 rounded bg-[#e10000] flex items-center justify-center shrink-0">
                          <span className="text-[7px] font-black text-white leading-none">airtel</span>
                        </div>
                        <span className="text-xs font-semibold text-neutral-700">AIRTEL-UG</span>
                      </label>

                      {/* Card Payments */}
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={cardUg}
                          onChange={(e) => setCardUg(e.target.checked)}
                          className="rounded border-neutral-300 text-blue-600 focus:ring-blue-600 w-4 h-4"
                        />
                        <div className="w-5 h-5 rounded bg-[#1e293b] flex items-center justify-center shrink-0">
                          <span className="text-[6px] font-black text-white leading-none">VISA/MC</span>
                        </div>
                        <span className="text-xs font-semibold text-neutral-700">CARD PAYMENTS-UG</span>
                      </label>
                    </div>
                  </div>

                  {/* Status selection */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1.5">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="input bg-white"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  {/* Submit Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                    <button 
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 border border-neutral-300 rounded-full text-xs font-semibold text-neutral-650 hover:bg-neutral-50"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-full text-xs font-semibold shadow-sm"
                    >
                      Create Product
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Product"
        message="Are you sure you want to delete this product? All active checkout links for this product will be deactivated."
        confirmText="Delete Product"
        cancelText="Cancel"
        isDestructive={true}
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}


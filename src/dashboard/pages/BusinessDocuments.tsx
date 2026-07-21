import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { sanitizeError } from '../../lib/errors'

interface UploadedDoc {
  id: string
  type: string
  fileName: string
  status: 'approved' | 'pending' | 'rejected'
  uploadedAt: string
}

export function BusinessDocuments() {
  const [documentType, setDocumentType] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function loadDocuments() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data: docs, error: fetchErr } = await supabase
          .from('business_documents')
          .select('*')
          .eq('merchant_id', user.id)
          .order('uploaded_at', { ascending: false })

        if (!fetchErr && docs) {
          setUploadedDocs(docs.map((d: any) => ({
            id: d.id,
            type: d.document_type,
            fileName: d.document_name,
            status: d.status,
            uploadedAt: new Date(d.uploaded_at).toISOString().split('T')[0]
          })))
        }
      }
    }
    loadDocuments()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!documentType) {
      setError('Please select a document type.')
      return
    }
    if (!selectedFile) {
      setError('Please select a file to upload.')
      return
    }
    if (!userId) return

    setLoading(true)

    const fakeFileUrl = `https://supabase.co/storage/v1/object/public/documents/${userId}/${Date.now()}_${selectedFile.name}`

    const { data: docRow, error: insertErr } = await supabase
      .from('business_documents')
      .insert({
        merchant_id: userId,
        document_type: documentType,
        document_name: selectedFile.name,
        file_url: fakeFileUrl,
        status: 'pending'
      })
      .select()
      .single()

    if (insertErr) {
      setError(sanitizeError(insertErr).userMessage)
      setLoading(false)
      return
    }

    // Automatically update merchant kyc_status to 'submitted'
    await supabase
      .from('merchants')
      .update({ kyc_status: 'submitted' })
      .eq('id', userId)

    // Log update in localStorage for immediate frontend reactive state sync
    localStorage.setItem('kyc_status', 'submitted')

    const newDoc: UploadedDoc = {
      id: docRow.id,
      type: docRow.document_type,
      fileName: docRow.document_name,
      status: docRow.status,
      uploadedAt: new Date(docRow.uploaded_at).toISOString().split('T')[0]
    }

    setUploadedDocs(prev => [newDoc, ...prev])
    setSelectedFile(null)
    setDocumentType('')
    setLoading(false)

    if (window.showToast) {
      window.showToast('Document uploaded successfully. KYC status updated to Submitted.', 'success')
    }

    // Reset input element
    const fileInput = document.getElementById('business-file-input') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-neutral-900">Get Started with Tamupay</h2>
        <p className="text-xs text-neutral-500 mt-1">Upload required documents to verify your business account.</p>
      </div>

      {/* 1. Required Documents Checklist Box */}
      <div className="bg-[#f0f4ff]/70 border border-brand-200 rounded-2xl p-5 space-y-4">
        <h4 className="text-xs font-bold text-neutral-800 tracking-wide uppercase">Required Documents for Business Accounts:</h4>
        
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5 text-xs text-neutral-700">
          <li className="flex items-start gap-2">
            <i className="fa-solid fa-circle-check text-brand-600 mt-0.5 shrink-0"></i>
            <div>
              <span className="font-semibold text-neutral-800">Certificate of Incorporation</span>
              <p className="text-[10px] text-neutral-500 mt-0.5">Official certificate issued at business registration.</p>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <i className="fa-solid fa-circle-check text-brand-600 mt-0.5 shrink-0"></i>
            <div>
              <span className="font-semibold text-neutral-800">Memorandum of Association (MoA)</span>
              <p className="text-[10px] text-neutral-500 mt-0.5">Document outlining the company's objectives and rules.</p>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <i className="fa-solid fa-circle-check text-brand-600 mt-0.5 shrink-0"></i>
            <div>
              <span className="font-semibold text-neutral-800">Shareholding Structure / Register</span>
              <p className="text-[10px] text-neutral-500 mt-0.5">List of all shareholders and their percentage ownership.</p>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <i className="fa-solid fa-circle-check text-brand-600 mt-0.5 shrink-0"></i>
            <div>
              <span className="font-semibold text-neutral-800">Copy of National ID/Passport of Directors</span>
              <p className="text-[10px] text-neutral-500 mt-0.5">Copy of national ID or passport for each director.</p>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <i className="fa-solid fa-circle-check text-brand-600 mt-0.5 shrink-0"></i>
            <div>
              <span className="font-semibold text-neutral-800">Regulatory / Operating License <span className="text-[10px] text-neutral-400 font-normal">(optional)</span></span>
              <p className="text-[10px] text-neutral-500 mt-0.5">Required for regulated industries (e.g. financial services, health).</p>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <i className="fa-solid fa-circle-check text-brand-600 mt-0.5 shrink-0"></i>
            <div>
              <span className="font-semibold text-neutral-800">Tax Identification Document <span className="text-[10px] text-neutral-400 font-normal">(optional)</span></span>
              <p className="text-[10px] text-neutral-500 mt-0.5">TIN certificate or tax registration document.</p>
            </div>
          </li>
          <li className="flex items-start gap-2 md:col-span-2">
            <i className="fa-solid fa-circle-check text-brand-600 mt-0.5 shrink-0"></i>
            <div>
              <span className="font-semibold text-neutral-800">Proof of Address</span>
              <p className="text-[10px] text-neutral-500 mt-0.5">Recent utility bill, bank statement, or official document showing address (under 3 months old).</p>
            </div>
          </li>
        </ul>

        <div className="pt-2 border-t border-brand-200/60 flex items-center justify-between flex-wrap gap-3">
          <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">PDF, JPG, or PNG - max 10 MB per file.</span>
          <button className="bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs px-4 py-2 rounded-full flex items-center gap-1.5 transition">
            <i className="fa-solid fa-file-arrow-down text-2xs"></i>
            <span>View and Download Wallet Agreement</span>
          </button>
        </div>
      </div>

      {/* 2. Upload Document Card */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-2xs">
        <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider border-b border-neutral-100 pb-3 mb-4">Document 1</h3>
        
        {error && (
          <div className="bg-error-50 border border-error-100 text-error-600 text-xs p-3 rounded mb-4 flex items-center gap-2">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Document Type Dropdown */}
            <div>
              <label className="label">Document Type *</label>
              <select 
                className="input py-2 bg-white"
                value={documentType}
                onChange={e => setDocumentType(e.target.value)}
                disabled={loading}
              >
                <option value="">-- Select document type --</option>
                <option value="Certificate of Incorporation">Certificate of Incorporation</option>
                <option value="Memorandum of Association (MoA)">Memorandum of Association (MoA)</option>
                <option value="Shareholding Structure / Register">Shareholding Structure / Register</option>
                <option value="Copy of National ID/Passport of Directors">Copy of National ID/Passport of Directors</option>
                <option value="Regulatory / Operating License">Regulatory / Operating License</option>
                <option value="Tax Identification Document">Tax Identification Document</option>
                <option value="Proof of Address">Proof of Address</option>
              </select>
            </div>

            {/* Document File Selector */}
            <div>
              <label className="label">Upload File *</label>
              <div className="flex items-center gap-3">
                <label className="btn-secondary py-2 cursor-pointer whitespace-nowrap shrink-0">
                  <i className="fa-solid fa-file-import text-3xs mr-1"></i>
                  <span>Choose File</span>
                  <input 
                    id="business-file-input"
                    type="file" 
                    className="hidden" 
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                    disabled={loading}
                  />
                </label>
                <div className="text-[10px] text-neutral-500 truncate">
                  {selectedFile ? selectedFile.name : 'No file chosen'}
                </div>
              </div>
              <p className="text-[9px] text-neutral-400 mt-1.5">PDF, JPG, or PNG - max 10 MB per file</p>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 flex justify-between items-center flex-wrap gap-4">
            <button 
              type="button" 
              className="border border-dashed border-neutral-300 hover:border-neutral-400 text-neutral-500 hover:text-neutral-700 bg-transparent text-xs py-2 px-4 rounded-full transition flex items-center gap-1.5"
            >
              <i className="fa-solid fa-plus text-3xs"></i>
              <span>Add Another Document</span>
            </button>
            
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner animate-spin text-2xs"></i>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-cloud-arrow-up text-2xs"></i>
                  <span>Upload All Documents</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 3. Your Uploaded Documents Section */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-2xs">
        <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider pb-3 border-b border-neutral-100 mb-4">Your Uploaded Documents</h3>
        
        {/* Search / filter control */}
        <div className="flex items-center gap-2 max-w-sm mb-4">
          <div className="relative w-full">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-xs"></i>
            <input 
              className="w-full bg-neutral-50 border border-neutral-200 rounded-full pl-9 pr-4 py-2 text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-300 transition-all"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Uploaded Documents List */}
        <div className="border border-neutral-200 rounded-2xl overflow-hidden bg-white">
          {uploadedDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center bg-neutral-25/30">
              <i className="fa-solid fa-folder-open text-neutral-450 text-2xl mb-3"></i>
              <h4 className="text-xs font-bold text-neutral-700">No business documents</h4>
              <p className="text-[10px] text-neutral-400 max-w-[200px] mt-1">Upload files above to submit verification requests.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider border-b border-neutral-200">
                  <th className="p-3">Doc ID</th>
                  <th className="p-3">Document Type</th>
                  <th className="p-3">File Name</th>
                  <th className="p-3">Uploaded At</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-xs">
                {uploadedDocs
                  .filter(doc => doc.type.toLowerCase().includes(searchQuery.toLowerCase()) || doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(doc => (
                    <tr key={doc.id} className="hover:bg-neutral-25 transition">
                      <td className="p-3 font-mono text-[10px] text-neutral-500">{doc.id}</td>
                      <td className="p-3 font-medium text-neutral-900">{doc.type}</td>
                      <td className="p-3 text-neutral-600 truncate max-w-[150px]">{doc.fileName}</td>
                      <td className="p-3 text-neutral-500">{doc.uploadedAt}</td>
                      <td className="p-3 text-right">
                        <span className="bg-warning-50 text-warning-700 border border-warning-200 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                          {doc.status}
                        </span>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

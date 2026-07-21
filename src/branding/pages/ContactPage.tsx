import { useState } from 'react'
import { Reveal } from '../../components/Reveal'

export function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setFormData({ name: '', email: '', phone: '', subject: 'General Inquiry', message: '' })
      if (window.showToast) {
        window.showToast('Message sent successfully! Our team will contact you shortly.', 'success')
      }
    }, 2000)
  }

  return (
    <div className="font-sans overflow-x-hidden bg-white text-neutral-850">
      
      {/* Hero — brand gradient, no external stock imagery */}
      <section
        className="relative pt-32 pb-20 sm:pb-28 text-white overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #151515 50%, #200000 100%)' }}
      >
        <div className="bg-orb w-[340px] h-[340px] -top-20 -left-20 bg-red-600/20 animate-orb-drift" />
        <Reveal className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">Contact our team</h1>
          <p className="text-sm sm:text-base text-neutral-300 max-w-xl mx-auto leading-relaxed">
            Have questions about merchant settlements, custom rates, integrations, or compliance? Drop us a line and we will reply shortly.
          </p>
        </Reveal>
      </section>

      {/* Main Form & Contact Info */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

            {/* Left: Contact Info details */}
            <Reveal variant="left" className="lg:col-span-5 space-y-8">
              <div className="space-y-4 text-center lg:text-left">
                <h2 className="text-3xl font-bold text-neutral-900 tracking-tight">Get in touch</h2>
                <p className="text-sm text-neutral-500 leading-relaxed max-w-md mx-auto lg:mx-0">
                  Whether you are a sole proprietor testing in sandbox or an enterprise routing millions of transactions, we are here to support your growth.
                </p>
              </div>

              {/* Direct Details Card with left stripe */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-md text-left">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                    <i className="fa-solid fa-phone text-sm" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Phone Support</h4>
                    <p className="text-sm text-neutral-800 font-bold mt-1">0761762626</p>
                    <p className="text-2xs text-neutral-400 mt-0.5">Monday to Friday, 8:00 AM — 6:00 PM</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                    <i className="fa-solid fa-envelope text-sm" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Email Inquiry</h4>
                    <p className="text-sm text-neutral-800 font-bold mt-1">support@lapterpay.com</p>
                    <p className="text-2xs text-neutral-400 mt-0.5">General &amp; Developer Integration Help</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 shrink-0">
                    <i className="fa-solid fa-location-dot text-sm" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Office Address</h4>
                    <p className="text-sm text-neutral-800 font-bold mt-1">Kampala, Uganda</p>
                    <p className="text-2xs text-neutral-400 mt-0.5">Commercial Payments Operations Center</p>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Right: Premium Form Card */}
            <Reveal variant="right" delay={100} className="lg:col-span-7 bg-white rounded-3xl shadow-xl p-8 border border-neutral-100 text-left">
              <h3 className="text-xl font-bold text-neutral-900 mb-6">Send us a message</h3>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label htmlFor="name" className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Full Name</label>
                    <input
                      id="name"
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-250 rounded-xl px-4 py-3 text-sm text-neutral-850 focus:outline-none focus:border-red-600 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Business Email</label>
                    <input
                      id="email"
                      type="email"
                      required
                      placeholder="e.g. john@business.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-250 rounded-xl px-4 py-3 text-sm text-neutral-850 focus:outline-none focus:border-red-600 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label htmlFor="phone" className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Phone Number</label>
                    <input
                      id="phone"
                      type="tel"
                      required
                      placeholder="e.g. +256 771 234567"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-250 rounded-xl px-4 py-3 text-sm text-neutral-850 focus:outline-none focus:border-red-600 transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="subject" className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Subject</label>
                    <select
                      id="subject"
                      value={formData.subject}
                      onChange={e => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full bg-neutral-50 border border-neutral-250 rounded-xl px-4 py-3 text-sm text-neutral-850 focus:outline-none focus:border-red-600 transition-colors cursor-pointer"
                    >
                      <option>General Inquiry</option>
                      <option>Developer Integration Support</option>
                      <option>Custom Settlement Volumes</option>
                      <option>Compliance Verification</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="message" className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Message Description</label>
                  <textarea
                    id="message"
                    required
                    rows={4}
                    placeholder="Describe your inquiry..."
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-neutral-50 border border-neutral-250 rounded-xl px-4 py-3 text-sm text-neutral-850 focus:outline-none focus:border-red-600 transition-colors resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitted}
                    className="btn-shimmer w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-full text-xs transition-all shadow-md border-0 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {submitted ? (
                      <>
                        <i className="fa-solid fa-spinner animate-spin" />
                        <span>Sending message...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-regular fa-paper-plane" />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </Reveal>

          </div>
        </div>
      </section>

    </div>
  )
}

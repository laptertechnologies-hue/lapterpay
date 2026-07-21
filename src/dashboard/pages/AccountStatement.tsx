import { useState, useEffect } from 'react'
import { SlidersHorizontal } from 'lucide-react'

const quickFilterOptions = [
  'Today',
  'Yesterday',
  'This Week',
  'Last Week',
  'This Month',
  'Last Month',
  'This Year'
]

interface StatementTxn {
  id: string
  date: string // e.g. "2026-06-23"
  type: 'collection' | 'disbursement'
  wallet: 'main' | 'card'
  amount: number
  charge: number
  status: 'Completed' | 'Pending' | 'Failed'
}

const mockStatementTxns: StatementTxn[] = [
  // Today (2026-06-24)
  { id: '1', date: '2026-06-24', type: 'collection', wallet: 'main', amount: 150000, charge: 1500, status: 'Completed' },
  { id: '2', date: '2026-06-24', type: 'disbursement', wallet: 'main', amount: 30000, charge: 300, status: 'Completed' },
  { id: '3', date: '2026-06-24', type: 'collection', wallet: 'card', amount: 75000, charge: 2250, status: 'Completed' },
  
  // Yesterday (2026-06-23)
  { id: '4', date: '2026-06-23', type: 'collection', wallet: 'main', amount: 50000, charge: 500, status: 'Completed' },
  { id: '5', date: '2026-06-23', type: 'disbursement', wallet: 'main', amount: 20000, charge: 200, status: 'Failed' },
  
  // This Week (2026-06-21 to 2026-06-24)
  { id: '6', date: '2026-06-22', type: 'collection', wallet: 'main', amount: 100000, charge: 1000, status: 'Completed' },
  { id: '7', date: '2026-06-21', type: 'collection', wallet: 'card', amount: 120000, charge: 3600, status: 'Pending' },
  
  // Earlier in This Month (June 2026)
  { id: '8', date: '2026-06-15', type: 'collection', wallet: 'main', amount: 300000, charge: 3000, status: 'Completed' },
  { id: '9', date: '2026-06-10', type: 'disbursement', wallet: 'main', amount: 150000, charge: 1500, status: 'Completed' },
  { id: '10', date: '2026-06-05', type: 'collection', wallet: 'main', amount: 50000, charge: 500, status: 'Failed' },
  
  // Last Month (May 2026)
  { id: '11', date: '2026-05-20', type: 'collection', wallet: 'main', amount: 250000, charge: 2500, status: 'Completed' },
  { id: '12', date: '2026-05-15', type: 'disbursement', wallet: 'main', amount: 100000, charge: 1000, status: 'Completed' },
  
  // Earlier in This Year (2026)
  { id: '13', date: '2026-04-12', type: 'collection', wallet: 'main', amount: 400000, charge: 4000, status: 'Completed' },
  { id: '14', date: '2026-03-18', type: 'disbursement', wallet: 'main', amount: 200000, charge: 2000, status: 'Completed' }
]

export function AccountStatement() {
  const [businessName, setBusinessName] = useState('Tamu wifi')
  const [activeQuickFilter, setActiveQuickFilter] = useState('This Month')
  const [startDate, setStartDate] = useState('2026-06-01')
  const [endDate, setEndDate] = useState('2026-06-30')
  const [txnType, setTxnType] = useState('All Types')
  const [status, setStatus] = useState('All Status')
  const [wallet, setWallet] = useState('All Wallets')

  useEffect(() => {
    const savedName = localStorage.getItem('merchant_business_name')
    if (savedName) setBusinessName(savedName)
  }, [])

  // Helper to get start and end dates for a quick filter option relative to 2026-06-24
  const getQuickFilterDates = (option: string) => {
    const today = new Date('2026-06-24')
    let start = new Date('2026-06-24')
    let end = new Date('2026-06-24')

    switch (option) {
      case 'Today':
        start = new Date('2026-06-24')
        end = new Date('2026-06-24')
        break
      case 'Yesterday':
        start = new Date('2026-06-23')
        end = new Date('2026-06-23')
        break
      case 'This Week':
        const day = today.getDay()
        start.setDate(today.getDate() - day)
        end = new Date('2026-06-24')
        break
      case 'Last Week':
        const day2 = today.getDay()
        start.setDate(today.getDate() - day2 - 7)
        end.setDate(today.getDate() - day2 - 1)
        break
      case 'This Month':
        start = new Date('2026-06-01')
        end = new Date('2026-06-30')
        break
      case 'Last Month':
        start = new Date('2026-05-01')
        end = new Date('2026-05-31')
        break
      case 'This Year':
        start = new Date('2026-01-01')
        end = new Date('2026-12-31')
        break
    }

    const formatDate = (d: Date) => d.toISOString().split('T')[0]
    return { start: formatDate(start), end: formatDate(end) }
  }

  useEffect(() => {
    const { start, end } = getQuickFilterDates(activeQuickFilter)
    setStartDate(start)
    setEndDate(end)
  }, [activeQuickFilter])

  const formatDatePretty = (dateStr: string) => {
    if (!dateStr) return ''
    const parts = dateStr.split('-')
    if (parts.length !== 3) return dateStr
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
  }

  // Filter logic
  const filteredStatementTxns = mockStatementTxns.filter(t => {
    const matchesStartDate = !startDate || t.date >= startDate
    const matchesEndDate = !endDate || t.date <= endDate
    const matchesType = txnType === 'All Types' || t.type === txnType.toLowerCase()
    const matchesStatus = status === 'All Status' || t.status === status
    const matchesWallet = wallet === 'All Wallets' || 
                          (wallet === 'Main Wallet' && t.wallet === 'main') ||
                          (wallet === 'Card Wallet' && t.wallet === 'card')
    
    return matchesStartDate && matchesEndDate && matchesType && matchesStatus && matchesWallet
  })

  const formatNum = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  // Balances (historical totals of all mock txns)
  const mainWalletBalance = mockStatementTxns
    .filter(t => t.wallet === 'main' && t.status === 'Completed')
    .reduce((sum, t) => sum + (t.type === 'collection' ? t.amount : -t.amount) - t.charge, 0)

  const cardWalletBalance = mockStatementTxns
    .filter(t => t.wallet === 'card' && t.status === 'Completed')
    .reduce((sum, t) => sum + (t.type === 'collection' ? t.amount : -t.amount) - t.charge, 0)

  const totalBalance = mainWalletBalance + cardWalletBalance

  // Filtered lists
  const mainTxns = filteredStatementTxns.filter(t => t.wallet === 'main')
  const cardTxns = filteredStatementTxns.filter(t => t.wallet === 'card')

  // Main Wallet sums (Filtered)
  const mainCredits = mainTxns
    .filter(t => t.type === 'collection' && t.status === 'Completed')
    .reduce((sum, t) => sum + t.amount, 0)
  const mainDebits = mainTxns
    .filter(t => t.type === 'disbursement' && t.status === 'Completed')
    .reduce((sum, t) => sum + t.amount + t.charge, 0)
  const mainNetChange = mainCredits - mainDebits

  // Card Wallet sums (Filtered)
  const cardCredits = cardTxns
    .filter(t => t.type === 'collection' && t.status === 'Completed')
    .reduce((sum, t) => sum + t.amount, 0)
  const cardDebits = cardTxns
    .filter(t => t.type === 'disbursement' && t.status === 'Completed')
    .reduce((sum, t) => sum + t.amount + t.charge, 0)
  const cardNetChange = cardCredits - cardDebits

  // Financial Summary (Filtered)
  const totalCollections = filteredStatementTxns
    .filter(t => t.type === 'collection' && t.status === 'Completed')
    .reduce((sum, t) => sum + t.amount, 0)
  const totalWithdrawals = filteredStatementTxns
    .filter(t => t.type === 'disbursement' && t.status === 'Completed')
    .reduce((sum, t) => sum + t.amount, 0)
  const totalCharges = filteredStatementTxns
    .filter(t => t.status === 'Completed')
    .reduce((sum, t) => sum + t.charge, 0)

  // Transaction Counts (Filtered)
  const completedCount = filteredStatementTxns.filter(t => t.status === 'Completed').length
  const pendingCount = filteredStatementTxns.filter(t => t.status === 'Pending').length
  const failedCount = filteredStatementTxns.filter(t => t.status === 'Failed').length

  // Transaction Types (Filtered)
  const collectionsCount = filteredStatementTxns.filter(t => t.type === 'collection').length
  const withdrawalsCount = filteredStatementTxns.filter(t => t.type === 'disbursement').length
  const totalCreditsSum = filteredStatementTxns
    .filter(t => t.type === 'collection' && t.status === 'Completed')
    .reduce((sum, t) => sum + t.amount, 0)
  const totalDebitsSum = filteredStatementTxns
    .filter(t => t.type === 'disbursement' && t.status === 'Completed')
    .reduce((sum, t) => sum + t.amount + t.charge, 0)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-base font-semibold text-neutral-900">Account Statement</h2>
          <p className="text-xs text-neutral-400 mt-0.5">Financial overview for {businessName}</p>
          <p className="text-[10px] text-neutral-400 font-medium mt-0.5">Showing <span className="font-semibold text-neutral-500">Uganda</span> wallet transactions</p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button className="bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-3.5 py-2 rounded-full flex items-center gap-1.5 transition shadow-sm flex-1 md:flex-none justify-center">
            <i className="fa-solid fa-file-pdf"></i>
            <span>Export PDF</span>
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs px-3.5 py-2 rounded-full flex items-center gap-1.5 transition shadow-sm flex-1 md:flex-none justify-center">
            <i className="fa-solid fa-file-excel"></i>
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm p-1.5 inline-flex items-center gap-1 overflow-x-auto no-scrollbar">
          {quickFilterOptions.map((opt) => {
            const isActive = activeQuickFilter === opt
            return (
              <button
                key={opt}
                onClick={() => setActiveQuickFilter(opt)}
                className={`flex items-center px-4 py-2 rounded-xl text-xs whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm font-semibold'
                    : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800'
                }`}
              >
                <span>{opt}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. Advanced Filters Box */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-4">
        <h4 className="text-xs font-bold text-neutral-800 tracking-wide uppercase flex items-center gap-1.5 border-b border-neutral-100 pb-3">
          <i className="fa-solid fa-square-check text-neutral-400 text-xs"></i>
          <span>Advanced Filters</span>
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
          <div>
            <label className="label">Start Date</label>
            <input 
              type="date" 
              className="input py-1.5" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
            />
          </div>

          <div>
            <label className="label">End Date</label>
            <input 
              type="date" 
              className="input py-1.5" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)} 
            />
          </div>

          <div>
            <label className="label">Transaction Type</label>
            <select 
              className="input py-2 bg-white" 
              value={txnType} 
              onChange={e => setTxnType(e.target.value)}
            >
              <option value="All Types">All Types</option>
              <option value="Collection">Collection</option>
              <option value="Disbursement">Disbursement</option>
            </select>
          </div>

          <div>
            <label className="label">Status</label>
            <select 
              className="input py-2 bg-white" 
              value={status} 
              onChange={e => setStatus(e.target.value)}
            >
              <option value="All Status">All Status</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          <div>
            <label className="label">Wallet</label>
            <select 
              className="input py-2 bg-white" 
              value={wallet} 
              onChange={e => setWallet(e.target.value)}
            >
              <option value="All Wallets">All Wallets</option>
              <option value="Main Wallet">Main Wallet</option>
              <option value="Card Wallet">Card Wallet</option>
            </select>
          </div>

          <div>
            <button className="btn-primary w-full py-2 flex items-center justify-center shadow-2xs">
              <SlidersHorizontal size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Four Summary Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Main Wallet */}
        <div className="bg-white border border-neutral-200 p-5 rounded-2xl border-l-4 border-l-brand-500 flex flex-col items-start gap-2.5 shadow-sm">
          <i className="fa-solid fa-wallet text-xl text-brand-600"></i>
          <div className="w-full">
            <div className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Main Wallet</div>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-2xl font-semibold text-neutral-900">{formatNum(mainWalletBalance)}</span>
              <span className="text-xs font-normal text-neutral-400">UGX</span>
            </div>
          </div>
        </div>

        {/* Card Wallet */}
        <div className="bg-white border border-neutral-200 p-5 rounded-2xl border-l-4 border-l-purple-500 flex flex-col items-start gap-2.5 shadow-sm">
          <i className="fa-solid fa-credit-card text-xl text-purple-600"></i>
          <div className="w-full">
            <div className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Card Wallet</div>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-2xl font-semibold text-neutral-900">{formatNum(cardWalletBalance)}</span>
              <span className="text-xs font-normal text-neutral-400">UGX</span>
            </div>
          </div>
        </div>

        {/* Total Balance */}
        <div className="bg-white border border-neutral-200 p-5 rounded-2xl border-l-4 border-l-green-500 flex flex-col items-start gap-2.5 shadow-sm">
          <i className="fa-solid fa-scale-balanced text-xl text-green-600"></i>
          <div className="w-full">
            <div className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Total Balance</div>
            <div className="flex items-baseline gap-1 mt-1.5">
              <span className="text-2xl font-semibold text-neutral-900">{formatNum(totalBalance)}</span>
              <span className="text-xs font-normal text-neutral-400">UGX (Main + Card)</span>
            </div>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="bg-white border border-neutral-200 p-5 rounded-2xl border-l-4 border-l-blue-500 flex flex-col items-start gap-2.5 shadow-sm">
          <i className="fa-solid fa-list-check text-xl text-blue-600"></i>
          <div className="w-full">
            <div className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Total Transactions</div>
            <div className="text-2xl font-semibold text-neutral-900 mt-1.5">{filteredStatementTxns.length}</div>
          </div>
        </div>
      </div>

      {/* 5. Two side-by-side transaction sum containers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Main Wallet Sum */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-center pb-2 border-b border-neutral-100 mb-4 bg-brand-50/50 p-2 rounded-xl">
            <span className="text-xs font-bold text-neutral-800">Main Wallet</span>
            <span className="text-[10px] text-neutral-400 font-semibold">{mainTxns.length} transaction{mainTxns.length !== 1 && 's'}</span>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-neutral-50">
              <span className="text-neutral-500 font-medium">Credits (completed):</span>
              <span className="font-bold text-success-600">{formatNum(mainCredits)} UGX</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-neutral-50">
              <span className="text-neutral-500 font-medium">Debits (completed):</span>
              <span className="font-bold text-error-600">{formatNum(mainDebits)} UGX</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-neutral-500 font-bold">Net Change:</span>
              <span className={`font-extrabold ${mainNetChange >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                {mainNetChange >= 0 ? '+' : ''}{formatNum(mainNetChange)} UGX
              </span>
            </div>
          </div>
        </div>

        {/* Card Wallet Sum */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-center pb-2 border-b border-neutral-100 mb-4 bg-purple-50/40 p-2 rounded-xl">
            <span className="text-xs font-bold text-neutral-800">Card Wallet</span>
            <span className="text-[10px] text-neutral-400 font-semibold">{cardTxns.length} transaction{cardTxns.length !== 1 && 's'}</span>
          </div>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-neutral-50">
              <span className="text-neutral-500 font-medium">Credits (completed):</span>
              <span className="font-bold text-success-600">{formatNum(cardCredits)} UGX</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-neutral-50">
              <span className="text-neutral-500 font-medium">Debits (completed):</span>
              <span className="font-bold text-error-600">{formatNum(cardDebits)} UGX</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-neutral-500 font-bold">Net Change:</span>
              <span className={`font-extrabold ${cardNetChange >= 0 ? 'text-success-600' : 'text-error-600'}`}>
                {cardNetChange >= 0 ? '+' : ''}{formatNum(cardNetChange)} UGX
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. Statement Summary details tables */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-5">
        <div>
          <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Statement Summary</h3>
          <div className="text-[10px] text-neutral-400 mt-1 font-semibold flex items-center gap-3">
            <span>Period: {formatDatePretty(startDate)} - {formatDatePretty(endDate)}</span>
            <span className="text-neutral-300">|</span>
            <span>Country: Uganda</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-3 border-t border-neutral-100">
          {/* Column 1: Financial Summary */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold text-neutral-800 border-b border-neutral-100 pb-2">Financial Summary</h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-neutral-50">
                <span className="text-neutral-500">Total Collections:</span>
                <span className="font-bold text-success-600">{formatNum(totalCollections)} UGX</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-50">
                <span className="text-neutral-500">Total Withdrawals:</span>
                <span className="font-bold text-error-600">{formatNum(totalWithdrawals)} UGX</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-500">Total Charges:</span>
                <span className="font-bold text-warning-600">{formatNum(totalCharges)} UGX</span>
              </div>
            </div>
          </div>

          {/* Column 2: Transaction Counts */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold text-neutral-800 border-b border-neutral-100 pb-2">Transaction Counts</h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-neutral-50">
                <span className="text-neutral-500">Total Transactions:</span>
                <span className="font-bold text-neutral-800">{filteredStatementTxns.length}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-50">
                <span className="text-neutral-505">Completed:</span>
                <span className="font-bold text-success-600">{completedCount}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-50">
                <span className="text-neutral-505">Pending:</span>
                <span className="font-bold text-warning-600">{pendingCount}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-505">Failed:</span>
                <span className="font-bold text-error-600">{failedCount}</span>
              </div>
            </div>
          </div>

          {/* Column 3: Transaction Types */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold text-neutral-800 border-b border-neutral-100 pb-2">Transaction Types</h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-neutral-50">
                <span className="text-neutral-505">Collections Count:</span>
                <span className="font-bold text-success-600">{collectionsCount}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-50">
                <span className="text-neutral-505">Withdrawals Count:</span>
                <span className="font-bold text-neutral-400">{withdrawalsCount}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-50">
                <span className="text-neutral-505">Total Credits:</span>
                <span className="font-bold text-success-600">{formatNum(totalCreditsSum)} UGX</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-505">Total Debits:</span>
                <span className="font-bold text-error-600">{formatNum(totalDebitsSum)} UGX</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

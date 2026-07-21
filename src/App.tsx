import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Brand pages
import { BrandLayout } from './branding/BrandLayout'
import { HomePage } from './branding/pages/HomePage'
import { FeaturesPage } from './branding/pages/FeaturesPage'
import { PricingPage } from './branding/pages/PricingPage'
import { DevelopersPage } from './branding/pages/DevelopersPage'
import { FaqPage } from './branding/pages/FaqPage'
import { ContactPage } from './branding/pages/ContactPage'
import { LoginPage } from './branding/pages/LoginPage'
import { RegisterPage } from './branding/pages/RegisterPage'
import { ForgotPasswordPage } from './branding/pages/ForgotPasswordPage'
import { TermsPage } from './branding/pages/TermsPage'
import { PrivacyPage } from './branding/pages/PrivacyPage'

// Dashboard
import { DashboardLayout } from './dashboard/DashboardLayout'
import { DashboardHome } from './dashboard/pages/DashboardHome'
import { Transactions } from './dashboard/pages/Transactions'
import { Refunds } from './dashboard/pages/Refunds'
import { AccountStatement } from './dashboard/pages/AccountStatement'
import { Collection } from './dashboard/pages/Collection'
import { PaymentLinks } from './dashboard/pages/PaymentLinks'
import { Products } from './dashboard/pages/Products'
import { BankDetails } from './dashboard/pages/BankDetails'
import { ServiceMarketplace } from './dashboard/pages/ServiceMarketplace'
import { BusinessDocuments } from './dashboard/pages/BusinessDocuments'
import { UserManagement } from './dashboard/pages/UserManagement'
import { Roles } from './dashboard/pages/Roles'
import { BusinessInformation } from './dashboard/pages/BusinessInformation'
import { WithdrawalPhoneNumbers } from './dashboard/pages/WithdrawalPhoneNumbers'
import { SupportTickets } from './dashboard/pages/SupportTickets'
import { ApiKeys } from './dashboard/pages/ApiKeys'
import { Security } from './dashboard/pages/Security'
import { IpWhitelist } from './dashboard/pages/IpWhitelist'
import { Documentation } from './dashboard/pages/Documentation'
import { DocumentationDetail } from './dashboard/pages/DocumentationDetail'
import { FloatManagement } from './dashboard/pages/FloatManagement'
import { ManageSubAccounts } from './dashboard/pages/ManageSubAccounts'
import { CallbackLogs } from './dashboard/pages/CallbackLogs'
import { SendMoney } from './dashboard/pages/SendMoney'
import { WalletTransfer } from './dashboard/pages/WalletTransfer'
import { BulkPayments } from './dashboard/pages/BulkPayments'
import { PushToBank } from './dashboard/pages/PushToBank'
import { PayBills } from './dashboard/pages/PayBills'
import { AirtimeData } from './dashboard/pages/AirtimeData'

// Super Admin imports
import { AdminLogin } from './admin/AdminLogin'
import { AdminLayout } from './admin/AdminLayout'
import { AdminDashboardHome } from './admin/pages/AdminDashboardHome'
import { AdminUsers } from './admin/pages/AdminUsers'
import { AdminMerchants } from './admin/pages/AdminMerchants'
import { AdminFloat } from './admin/pages/AdminFloat'
import { AdminSettings } from './admin/pages/AdminSettings'

import './index.css'
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Standalone documentation pages without dashboard sidebar */}
          <Route path="/documentation" element={<Documentation />} />
          <Route path="/documentation/:topic" element={<DocumentationDetail />} />

          {/* Brand / public pages with shared layout */}
          <Route element={<BrandLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/developers" element={<DevelopersPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/docs" element={<Navigate to="/documentation" replace />} />
          </Route>

          {/* Auth pages (no shared layout) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Dashboard */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="refunds" element={<Refunds />} />
            <Route path="account-statement" element={<AccountStatement />} />
            <Route path="float-management" element={<FloatManagement />} />
            <Route path="business-documents" element={<BusinessDocuments />} />
            <Route path="service-marketplace" element={<ServiceMarketplace />} />
            <Route path="sub-accounts" element={<ManageSubAccounts />} />
            <Route path="callback-logs" element={<CallbackLogs />} />
            <Route path="send-money" element={<SendMoney />} />
            <Route path="wallet-transfer" element={<WalletTransfer />} />
            <Route path="pay-bills" element={<PayBills />} />
            <Route path="airtime-data" element={<AirtimeData />} />
            <Route path="bulk-payments" element={<BulkPayments />} />
            <Route path="bank-details" element={<BankDetails />} />
            <Route path="collection" element={<Collection />} />
            <Route path="payment-links" element={<PaymentLinks />} />
            <Route path="products" element={<Products />} />
            <Route path="push-to-bank" element={<PushToBank />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="roles" element={<Roles />} />
            <Route path="business-information" element={<BusinessInformation />} />
            <Route path="security" element={<Security />} />
            <Route path="withdrawal-numbers" element={<WithdrawalPhoneNumbers />} />
            <Route path="support-tickets" element={<SupportTickets />} />
            <Route path="api-keys" element={<ApiKeys />} />
            <Route path="ip-whitelist" element={<IpWhitelist />} />
          </Route>

          {/* Admin Dashboard */}
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin-user" element={<AdminLayout />}>
            <Route index element={<AdminDashboardHome />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="merchants" element={<AdminMerchants />} />
            <Route path="float" element={<AdminFloat />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

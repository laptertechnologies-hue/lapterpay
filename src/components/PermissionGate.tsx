import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Lock, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import { isSubscribed } from '../lib/subscriptions';

interface PermissionGateProps {
  requires?: 'kyc' | 'subscription';
  serviceKey?: string;
  kycStatus?: 'pending' | 'submitted' | 'approved' | 'rejected' | null;
  children: ReactNode;
}

export function PermissionGate({
  requires = 'subscription',
  serviceKey,
  kycStatus = 'pending',
  children,
}: PermissionGateProps) {
  // 1. Subscription Check
  if (requires === 'subscription' && serviceKey) {
    const subscribed = isSubscribed(serviceKey);
    if (!subscribed) {
      return (
        <div className="bg-white border border-neutral-200/80 rounded-3xl p-8 md:p-12 text-center max-w-xl mx-auto shadow-xs my-8 font-sans">
          <div className="w-14 h-14 bg-blue-50 border border-blue-100 text-[#011478] rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={24} />
          </div>
          <h3 className="text-lg font-normal text-neutral-900 mb-2">Subscription Required</h3>
          <p className="text-sm text-neutral-500 mb-8 leading-relaxed">
            You need an active subscription to use this service. Please subscribe first.
          </p>
          <Link
            to="/dashboard/service-marketplace"
            className="inline-flex items-center justify-center px-6 py-3 bg-[#011478] hover:bg-[#1e3a8a] text-white rounded-full text-xs font-semibold shadow-xs transition-colors"
          >
            Go to Service Marketplace
          </Link>
        </div>
      );
    }
  }

  // 2. KYC / Business Verification Check
  if (requires === 'kyc') {
    if (kycStatus !== 'approved') {
      let icon = <FileText size={24} />;
      let title = 'Verification Required';
      let desc = 'Your business is not yet verified. Please upload your business documents to proceed.';
      let ctaText = 'Upload Documents';
      let ctaLink = '/dashboard/business-documents';

      if (kycStatus === 'submitted') {
        icon = <CheckCircle2 size={24} className="text-amber-500" />;
        title = 'Verification In Progress';
        desc = 'Your business verification is currently being reviewed by our administrators. This usually takes 24-48 hours.';
        ctaText = 'View Uploaded Documents';
      } else if (kycStatus === 'rejected') {
        icon = <ShieldAlert size={24} className="text-red-500" />;
        title = 'Verification Rejected';
        desc = 'Your business verification was rejected due to invalid or expired documents. Please re-upload valid documents.';
        ctaText = 'Re-upload Documents';
      }

      return (
        <div className="bg-white border border-neutral-200/80 rounded-3xl p-8 md:p-12 text-center max-w-xl mx-auto shadow-xs my-8 font-sans">
          <div className="w-14 h-14 bg-amber-50 border border-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
            {icon}
          </div>
          <h3 className="text-lg font-normal text-neutral-900 mb-2">{title}</h3>
          <p className="text-sm text-neutral-500 mb-8 leading-relaxed">
            {desc}
          </p>
          <Link
            to={ctaLink}
            className="inline-flex items-center justify-center px-6 py-3 bg-[#011478] hover:bg-[#1e3a8a] text-white rounded-full text-xs font-semibold shadow-xs transition-colors"
          >
            {ctaText}
          </Link>
        </div>
      );
    }
  }

  return <>{children}</>;
}

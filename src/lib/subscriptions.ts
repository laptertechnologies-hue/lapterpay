export interface ServiceSubscription {
  id: string;
  name: string;
  key: string;
  subscribed: boolean;
}

const DEFAULT_SUBSCRIPTIONS: Record<string, boolean> = {
  'collection_mtn': true,
  'collection_airtel': true,
  'disbursement_mtn': true,
  'disbursement_airtel': true,
  'disbursement_bank': true,
  'float_mgmt': true,
  'phone_verification': true,
  'sms_service': false,
  'wallet_transfer': true,
  'bill_payments': false,
  'card_payments': true,
  'merchant_customization': false,
};

export function getSubscriptions(): Record<string, boolean> {
  if (typeof window === 'undefined') return DEFAULT_SUBSCRIPTIONS;
  const stored = localStorage.getItem('tamupay_subscriptions');
  if (!stored) {
    localStorage.setItem('tamupay_subscriptions', JSON.stringify(DEFAULT_SUBSCRIPTIONS));
    return DEFAULT_SUBSCRIPTIONS;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return DEFAULT_SUBSCRIPTIONS;
  }
}

export function isSubscribed(serviceKey: string): boolean {
  const subs = getSubscriptions();
  return !!subs[serviceKey];
}

export function setSubscribed(serviceKey: string, subscribed: boolean) {
  if (typeof window === 'undefined') return;
  const subs = getSubscriptions();
  subs[serviceKey] = subscribed;
  localStorage.setItem('tamupay_subscriptions', JSON.stringify(subs));
}

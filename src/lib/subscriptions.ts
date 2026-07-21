import { supabase } from './supabase';

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
  const stored = localStorage.getItem('lapterpay_subscriptions');
  if (!stored) {
    localStorage.setItem('lapterpay_subscriptions', JSON.stringify(DEFAULT_SUBSCRIPTIONS));
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
  localStorage.setItem('lapterpay_subscriptions', JSON.stringify(subs));
}

export function syncSubscriptions(dbSubs: { service_key: string, status: string }[]) {
  if (typeof window === 'undefined') return;
  const subsMap = { ...DEFAULT_SUBSCRIPTIONS };
  dbSubs.forEach(s => {
    subsMap[s.service_key] = s.status === 'active';
  });
  localStorage.setItem('lapterpay_subscriptions', JSON.stringify(subsMap));
}

export async function updateSubscriptionInDb(userId: string, serviceKey: string, active: boolean) {
  const statusVal = active ? 'active' : 'cancelled';
  const { error } = await supabase
    .from('service_subscriptions')
    .upsert({
      merchant_id: userId,
      service_key: serviceKey,
      status: statusVal
    }, {
      onConflict: 'merchant_id,service_key'
    });
  
  if (!error) {
    setSubscribed(serviceKey, active);
  }
  return error;
}

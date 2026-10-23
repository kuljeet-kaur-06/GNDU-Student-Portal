// Deliberately provider-independent: this portal records only administrator-confirmed offline payments.
export const offlinePaymentMethods = ['CASH', 'BANK_TRANSFER', 'RECEIPT_BASED']
export const onlinePaymentsAvailable = false

export function feeStatus(amountDueMinor, amountPaidMinor) {
  if (amountPaidMinor <= 0) return 'UNPAID'
  return amountPaidMinor >= amountDueMinor ? 'PAID' : 'PARTIALLY_PAID'
}

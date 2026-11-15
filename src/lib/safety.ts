// Spots messages that look like money requests or attempts to move the chat
// off the app, so we can warn people before they get scammed.
const MONEY = /\b(momo|mobile\s*money|send\s+(me\s+)?(money|cash|airtime|data)|airtime|transfer|cedis?|ghs|gh₵|account\s+number|western\s+union|loan|bitcoin|crypto|gift\s*card)\b/i;
const PHONE = /(\+?233|0)[\s-]?[235]\d[\s-]?\d{3}[\s-]?\d{4}\b/;

export function looksLikeMoneyRequest(text: string): boolean {
  return MONEY.test(text);
}

export function containsPhoneNumber(text: string): boolean {
  return PHONE.test(text);
}

export const MONEY_WARNING =
  'Never send money, MoMo or airtime to someone you met on Crushwave. If they keep asking, report them.';

export const PHONE_WARNING =
  'Take your time before sharing your number. Keeping chats on Crushwave means you can report and block if needed.';

// Client-side guard verifying email layout strings before hitting remote tables
export const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Sales Dashboard users must log in with a company address on this domain —
// personal domains (gmail.com, yahoo.com, outlook.com, etc.) are rejected.
// This mirrors the same check enforced server-side in
// server/routes/salesAdmin.js, which is the authoritative source of truth.
export const SALES_EMAIL_DOMAIN = 'kdmarketinggroup.org';

export const isSalesCompanyEmail = (email) => {
  if (!validateEmail(email)) return false;
  return email.trim().toLowerCase().endsWith(`@${SALES_EMAIL_DOMAIN}`);
};

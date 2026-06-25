// Client-side guard verifying email layout strings before hitting remote tables
export const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
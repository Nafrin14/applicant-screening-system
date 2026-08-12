// Conversions of datetime ISO strings into standard calendar grid flags
export const formatDateString = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  return date.toISOString().split('T')[0];
};
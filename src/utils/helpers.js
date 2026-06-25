// Extracts and standardizes a timestamp into a clean YYYY-MM-DD format for calendar tracking
export const formatDateString = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  return date.toISOString().split('T')[0];
};
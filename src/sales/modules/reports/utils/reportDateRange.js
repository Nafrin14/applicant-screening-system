// Resolves the reports page's filter ('all' | 'today' | 'yesterday' | 'week'
// | 'month' | 'custom') plus optional custom from/to dates into a concrete
// { start, end } Date range for querying csv_uploads.
export function getDateRange(filter, fromDate, toDate) {
  const today = new Date();
  let start = new Date();
  let end = new Date();

  if (filter === "all") {
    start = new Date("2000-01-01");
    end = new Date();
    end.setHours(23, 59, 59, 999);
  }

  if (filter === "today") {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  }

  if (filter === "yesterday") {
    start.setDate(today.getDate() - 1);
    start.setHours(0, 0, 0, 0);

    end.setDate(today.getDate() - 1);
    end.setHours(23, 59, 59, 999);
  }

  if (filter === "week") {
    start.setDate(today.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  }

  if (filter === "month") {
    start = new Date(today.getFullYear(), today.getMonth(), 1);
    end.setHours(23, 59, 59, 999);
  }

  if (filter === "custom" && fromDate && toDate) {
    start = new Date(fromDate);
    end = new Date(toDate);
    end.setHours(23, 59, 59, 999);
  }

  return { start, end };
}

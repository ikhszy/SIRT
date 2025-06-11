export function formatDateIndo(dateStr) {
  if (!dateStr) return "";

  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const [yyyy, mm, dd] = dateStr.split("-");
  const monthName = months[parseInt(mm, 10) - 1];

  return `${dd} ${monthName} ${yyyy}`;
}

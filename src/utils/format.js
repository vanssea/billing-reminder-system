export const formatIDR = (value) => "Rp" + Number(value).toLocaleString("id-ID");

export const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);

export const formatDate = (iso) => {
  if (!iso || String(iso).startsWith("0001")) return "—";
  let d;
  if (String(iso).includes("T")) {
    d = new Date(iso);
  } else {
    d = new Date(`${iso}T00:00:00`);
  }
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
};
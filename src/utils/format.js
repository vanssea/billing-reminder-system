export const formatIDR = (value) => "Rp" + Number(value).toLocaleString("id-ID");

export const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);

export const formatDate = (iso) =>
  iso
    ? new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(`${iso}T00:00:00`))
    : "—";
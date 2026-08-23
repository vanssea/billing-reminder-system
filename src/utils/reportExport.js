// Utilitas export laporan (CSV & PDF) untuk halaman Reports.
// CSV memakai separator ";" + BOM agar rapi saat dibuka di Excel locale Indonesia.

const formatRupiahExport = (v) => `Rp ${(Number(v) || 0).toLocaleString("id-ID")}`;

const formatDateExport = (v) =>
  v
    ? new Date(v).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-";

const formatDateTimeExport = (v) =>
  v
    ? new Date(v).toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

const periodLabel = (from, to) => {
  if (!from && !to) return "Seluruh periode";
  const start = from ? formatDateExport(from) : "Awal";
  const end = to ? formatDateExport(to) : "Sekarang";
  return `${start} s/d ${end}`;
};

// Deteksi separator CSV sesuai regional setting OS:
// - Desimal koma (id-ID, dll.) -> list separator Excel ";"
// - Desimal titik (en-US, dll.) -> list separator Excel ","
const detectCsvSeparator = () => ((1.1).toLocaleString().includes(".") ? "," : ";");

const toCSV = (headers, rows, sep) =>
  [
    headers.join(sep),
    ...rows.map((r) =>
      r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(sep)
    ),
  ].join("\r\n");

const saveBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Unduh laporan CSV dengan blok judul agar rapi saat dibuka di Excel.
 * rows harus berupa string yang sudah diformat (Rupiah / tanggal).
 */
const downloadCSVReport = ({ filename, title, period, headers, rows }) => {
  const sep = detectCsvSeparator();
  const lines = [
    `${title} - Billing Reminder System`,
    `Periode: ${period}`,
    `Dibuat: ${formatDateTimeExport(new Date().toISOString())}`,
    "",
    toCSV(headers, rows, sep),
  ];

  saveBlob(
    new Blob(["\uFEFF" + lines.join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    }),
    filename
  );
};

/**
 * Unduh laporan PDF A4 potret: header berwarna, ringkasan, dan tabel
 * dengan wrapping otomatis serta pindah halaman. Digambar manual dengan
 * jsPDF inti (tanpa plugin tambahan).
 *
 * summary: [{ label, value }]
 * colWidths: bobot lebar kolom (opsional, default sama rata)
 * aligns: "left" | "right" per kolom (opsional)
 */
const downloadPDFReport = async ({
  filename,
  title,
  period,
  summary = [],
  headers,
  rows,
  colWidths,
  aligns,
}) => {
  const jsPDF = (await import("jspdf")).default;
  const pdf = new jsPDF("p", "mm", "a4");

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const marginX = 14;
  const usableW = pageW - marginX * 2;

  const INDIGO = [53, 37, 205];
  const DARK = [25, 28, 30];
  const GRAY = [100, 97, 116];
  const LIGHT = [245, 244, 250];
  const BORDER = [226, 224, 234];

  // ---------- Header ----------
  pdf.setFillColor(...INDIGO);
  pdf.rect(0, 0, pageW, 26, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text(title, marginX, 12);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text(
    `Billing Reminder System  |  Periode: ${period}`,
    marginX,
    19
  );

  let y = 36;

  // ---------- Ringkasan ----------
  if (summary.length > 0) {
    const cardW = (usableW - 6) / 2;
    const cardH = 14;

    summary.slice(0, 6).forEach((item, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = marginX + col * (cardW + 6);
      const cy = y + row * (cardH + 4);

      pdf.setFillColor(...LIGHT);
      pdf.roundedRect(x, cy, cardW, cardH, 2, 2, "F");

      pdf.setTextColor(...GRAY);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.text(item.label, x + 4, cy + 5.5);

      pdf.setTextColor(...DARK);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text(item.value, x + 4, cy + 11);
    });

    y += Math.ceil(Math.min(summary.length, 6) / 2) * (cardH + 4) + 4;
  }

  // ---------- Tabel ----------
  const totalWeight =
    colWidths?.length === headers.length
      ? colWidths.reduce((s, w) => s + w, 0)
      : headers.length;

  const colWs = headers.map((_, i) =>
    colWidths?.length === headers.length
      ? (colWidths[i] / totalWeight) * usableW
      : usableW / headers.length
  );

  const cellPad = 2.5;
  const lineH = 4;

  const drawRow = (cells, { header = false, striped = false } = {}) => {
    pdf.setFont("helvetica", header ? "bold" : "normal");
    pdf.setFontSize(header ? 8 : 8);

    const splitCells = cells.map((cell, i) =>
      pdf.splitTextToSize(String(cell ?? "-"), colWs[i] - cellPad * 2)
    );
    const maxLines = Math.max(...splitCells.map((c) => c.length), 1);
    const rowH = maxLines * lineH + 3;

    if (y + rowH > pageH - 18) {
      pdf.addPage();
      y = 16;
    }

    if (header) {
      pdf.setFillColor(...INDIGO);
      pdf.rect(marginX, y, usableW, rowH, "F");
      pdf.setTextColor(255, 255, 255);
    } else {
      if (striped) {
        pdf.setFillColor(...LIGHT);
        pdf.rect(marginX, y, usableW, rowH, "F");
      }
      pdf.setTextColor(...DARK);
    }

    pdf.setDrawColor(...BORDER);
    pdf.setLineWidth(0.2);
    pdf.rect(marginX, y, usableW, rowH);

    let x = marginX;
    splitCells.forEach((cellLines, i) => {
      pdf.rect(x, y, colWs[i], rowH);

      const align = aligns?.[i];
      cellLines.forEach((line, li) => {
        const ty = y + 5.5 + li * lineH;
        if (align === "right") {
          pdf.text(line, x + colWs[i] - cellPad, ty, { align: "right" });
        } else {
          pdf.text(line, x + cellPad, ty);
        }
      });

      x += colWs[i];
    });

    y += rowH;
  };

  drawRow(headers, { header: true });

  if (rows.length === 0) {
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(9);
    pdf.setTextColor(...GRAY);
    y += 10;
    pdf.text("Tidak ada data pada periode ini.", pageW / 2, y, {
      align: "center",
    });
  } else {
    rows.forEach((row, index) => drawRow(row, { striped: index % 2 === 1 }));
  }

  // ---------- Footer nomor halaman ----------
  const pageCount = pdf.getNumberOfPages();
  for (let p = 1; p <= pageCount; p += 1) {
    pdf.setPage(p);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...GRAY);
    pdf.text(
      `Halaman ${p} dari ${pageCount}`,
      pageW / 2,
      pageH - 8,
      { align: "center" }
    );
  }

  pdf.save(filename);
};

export {
  formatRupiahExport,
  formatDateExport,
  formatDateTimeExport,
  periodLabel,
  downloadCSVReport,
  downloadPDFReport,
};

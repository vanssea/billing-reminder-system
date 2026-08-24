import { useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import {
  BellRing,
  CheckCircle2,
  Clock3,
  Globe,
  Info,
  MessageSquare,
  RotateCcw,
  Save,
  Wallet,
} from "lucide-react";

const STORAGE_KEY = "superadmin_settings_v1";

const DEFAULT_SETTINGS = {
  reminder: {
    h3: true,
    h1: true,
    h0: true,
    sendTime: "09:00",
    channel: "WHATSAPP",
  },
  notifications: {
    paymentReceived: true,
    overdueDaily: true,
    weeklySummary: false,
    failedReminderAlert: true,
  },
};

const loadSettings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      reminder: { ...DEFAULT_SETTINGS.reminder, ...(parsed.reminder || {}) },
      notifications: {
        ...DEFAULT_SETTINGS.notifications,
        ...(parsed.notifications || {}),
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        checked ? "bg-[#3525cd]" : "bg-[#d9d6e3]"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

function SectionCard({ icon: Icon, title, description, children, accent = "#3525cd" }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e0e3e5] bg-white shadow-sm">
      <div className="flex items-start gap-3 border-b border-[#eef0f2] bg-[#faf9fc] px-5 py-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${accent}14`, color: accent }}
        >
          <Icon size={18} />
        </div>
        <div>
          <p className="text-sm font-bold text-[#191c1e]">{title}</p>
          <p className="mt-0.5 text-xs text-[#9a97a9]">{description}</p>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-[#c7c4d8] bg-white px-3 py-2 text-sm text-[#191c1e] outline-none transition focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20";

export default function Settings() {
  const [settings, setSettings] = useState(loadSettings);
  const [successMessage, setSuccessMessage] = useState("");

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const updateReminder = (key, value) =>
    setSettings((s) => ({ ...s, reminder: { ...s.reminder, [key]: value } }));

  const updateNotification = (key, value) =>
    setSettings((s) => ({
      ...s,
      notifications: { ...s.notifications, [key]: value },
    }));

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    showSuccess("Pengaturan berhasil disimpan di browser ini.");
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSettings(DEFAULT_SETTINGS);
    showSuccess("Pengaturan dikembalikan ke default.");
  };

  const reminderOptions = [
    { key: "h3", title: "H-3 Sebelum Jatuh Tempo", desc: "Kirim pengingat 3 hari sebelum due date." },
    { key: "h1", title: "H-1 Sebelum Jatuh Tempo", desc: "Kirim pengingat 1 hari sebelum due date." },
    { key: "h0", title: "Hari Jatuh Tempo (H-0)", desc: "Kirim pengingat pada hari due date." },
  ];

  const notificationOptions = [
    { key: "paymentReceived", title: "Pembayaran Masuk", desc: "Notifikasi saat ada pembayaran baru diterima.", icon: Wallet },
    { key: "overdueDaily", title: "Rekap Overdue Harian", desc: "Ringkasan invoice overdue setiap pagi.", icon: Clock3 },
    { key: "weeklySummary", title: "Ringkasan Mingguan", desc: "Laporan aktivitas billing tiap Senin pagi.", icon: BellRing },
    { key: "failedReminderAlert", title: "Reminder Gagal", desc: "Peringatan jika ada reminder yang gagal terkirim.", icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-[#fcf8ff] pt-16 app-content">
      <Sidebar />
      <Header role="superadmin" />

      <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#191c1e]">Settings</h1>
            <p className="mt-1 text-sm text-[#8b8898]">
              Kelola preferensi akun dan operasional billing.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-xl border border-[#e0e3e5] bg-white px-4 py-2.5 text-sm font-semibold text-[#464555] shadow-sm transition hover:bg-[#f6f4fa]"
            >
              <RotateCcw size={15} />
              Reset Default
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#3525cd] to-[#5b44f3] px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Save size={15} />
              Simpan Pengaturan
            </button>
          </div>
        </div>

        {successMessage && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100 px-4 py-3.5 shadow-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-500">
              <CheckCircle2 size={16} />
            </div>
            <span className="text-sm font-medium text-emerald-700">{successMessage}</span>
          </div>
        )}

        <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-500">
            <Info size={16} />
          </div>
          <p className="text-sm leading-relaxed text-blue-800">
            Mode frontend: pengaturan disimpan di <span className="font-semibold">localStorage browser ini</span> dan belum tersinkron dengan server. Data tetap ada setelah refresh selama menggunakan browser yang sama.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="xl:col-span-2 space-y-5">
            <SectionCard
              icon={Clock3}
              title="Default Reminder Invoice"
              description="Jadwal otomatis pengiriman pengingat sebelum jatuh tempo."
            >
              <div className="space-y-3">
                {reminderOptions.map((opt) => (
                  <div
                    key={opt.key}
                    className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3.5 transition ${
                      settings.reminder[opt.key]
                        ? "border-[#3525cd]/25 bg-[#3525cd]/[0.04]"
                        : "border-[#eef0f2] bg-white"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-bold text-[#191c1e]">{opt.title}</p>
                      <p className="mt-0.5 text-xs text-[#9a97a9]">{opt.desc}</p>
                    </div>
                    <Toggle
                      checked={settings.reminder[opt.key]}
                      onChange={(v) => updateReminder(opt.key, v)}
                      label={opt.title}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#8b8898]">
                    Jam Pengiriman
                  </label>
                  <input
                    type="time"
                    value={settings.reminder.sendTime}
                    onChange={(e) => updateReminder("sendTime", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#8b8898]">
                    Kanal Pengiriman
                  </label>
                  <select
                    value={settings.reminder.channel}
                    onChange={(e) => updateReminder("channel", e.target.value)}
                    className={inputClass}
                  >
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="EMAIL" disabled>Email (segera hadir)</option>
                  </select>
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="space-y-5">
            <SectionCard
              icon={BellRing}
              title="Notifikasi"
              description="Pilih aktivitas yang ingin kamu terima notifikasinya."
              accent="#b02463"
            >
              <div className="space-y-3">
                {notificationOptions.map((opt) => {
                  const OptIcon = opt.icon;
                  return (
                    <div
                      key={opt.key}
                      className="flex items-start justify-between gap-3 rounded-xl border border-[#eef0f2] px-4 py-3.5"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#b02463]/10 text-[#b02463]">
                          <OptIcon size={15} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#191c1e]">{opt.title}</p>
                          <p className="mt-0.5 text-xs text-[#9a97a9]">{opt.desc}</p>
                        </div>
                      </div>
                      <Toggle
                        checked={settings.notifications[opt.key]}
                        onChange={(v) => updateNotification(opt.key, v)}
                        label={opt.title}
                      />
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard
              icon={Globe}
              title="Tampilan Sistem"
              description="Konfigurasi tampilan global aplikasi."
              accent="#0d9488"
            >
              <dl className="space-y-3">
                {[
                  { term: "Zona Waktu", desc: "Asia/Jakarta (WIB, UTC+7)" },
                  { term: "Mata Uang", desc: "IDR - Rupiah" },
                  { term: "Bahasa", desc: "Indonesia" },
                  { term: "Versi Frontend", desc: "billing-reminder-system v0.0.0" },
                ].map((row) => (
                  <div
                    key={row.term}
                    className="flex items-center justify-between rounded-xl bg-[#faf9fc] px-4 py-3"
                  >
                    <dt className="text-sm font-semibold text-[#464555]">{row.term}</dt>
                    <dd className="text-xs font-medium text-[#8b8898]">{row.desc}</dd>
                  </div>
                ))}
              </dl>
            </SectionCard>
          </div>
        </div>
      </main>
    </div>
  );
}

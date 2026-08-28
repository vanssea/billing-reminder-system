import { useEffect, useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import { useAuth } from "../../context/AuthContext";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Globe,
  RotateCcw,
  Save,
} from "lucide-react";
import { getSettings, updateSettings } from "../../services/settingsApi";

const DEFAULT_SEND_TIME = "08:00";

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
  const { accessToken } = useAuth();
  const [enabledTypes, setEnabledTypes] = useState([]);
  const [sendTime, setSendTime] = useState(DEFAULT_SEND_TIME);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!accessToken) return;
      try {
        const data = await getSettings(accessToken);
        setEnabledTypes(data.enabled_types || []);
        setSendTime(data.send_time || DEFAULT_SEND_TIME);
        setTypes(data.types || []);
      } catch (err) {
        setErrorMessage(err.message || "Gagal memuat pengaturan.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [accessToken]);

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setErrorMessage("");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const toggleType = (type) => {
    setEnabledTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSave = async () => {
    try {
      const saved = await updateSettings(
        { enabled_types: enabledTypes, send_time: sendTime },
        accessToken
      );
      setEnabledTypes(saved.enabled_types || []);
      setSendTime(saved.send_time || DEFAULT_SEND_TIME);
      setTypes(saved.types || []);
      showSuccess("Pengaturan berhasil disimpan.");
    } catch (err) {
      setErrorMessage(err.message || "Gagal menyimpan pengaturan.");
    }
  };

  const handleReset = async () => {
    try {
      const saved = await updateSettings(
        { enabled_types: types.map((t) => t.type), send_time: DEFAULT_SEND_TIME },
        accessToken
      );
      setEnabledTypes(saved.enabled_types || []);
      setSendTime(saved.send_time || DEFAULT_SEND_TIME);
      setTypes(saved.types || []);
      showSuccess("Pengaturan dikembalikan ke default.");
    } catch (err) {
      setErrorMessage(err.message || "Gagal mereset pengaturan.");
    }
  };

  return (
    <div className="min-h-screen bg-[#fcf8ff] pt-16 app-content">
      <Sidebar />
      <Header role="superadmin" />

      <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#191c1e]">Settings</h1>
            <p className="mt-1 text-sm text-[#8b8898]">
              Konfigurasi pengingat invoice (disimpan di server).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-[#e0e3e5] bg-white px-4 py-2.5 text-sm font-semibold text-[#464555] shadow-sm transition hover:bg-[#f6f4fa] disabled:opacity-50"
            >
              <RotateCcw size={15} />
              Reset Default
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#3525cd] to-[#5b44f3] px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
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

        {errorMessage && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-red-100 px-4 py-3.5 shadow-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-500">
              <AlertCircle size={16} />
            </div>
            <span className="text-sm font-medium text-red-700">{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="xl:col-span-2 space-y-5">
            <SectionCard
              icon={Clock3}
              title="Default Reminder Invoice"
              description="Jadwal otomatis pengiriman pengingat sebelum jatuh tempo."
            >
              {loading ? (
                <p className="text-sm text-[#9a97a9]">Memuat pengaturan...</p>
              ) : (
                <>
                  <div className="space-y-3">
                    {types.map((opt) => {
                      const checked = enabledTypes.includes(opt.type);
                      const title = `${opt.type} Sebelum Jatuh Tempo`;
                      const desc = `Kirim pengingat ${opt.days} hari sebelum jatuh tempo.`;
                      return (
                        <div
                          key={opt.type}
                          className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3.5 transition ${
                            checked
                              ? "border-[#3525cd]/25 bg-[#3525cd]/[0.04]"
                              : "border-[#eef0f2] bg-white"
                          }`}
                        >
                          <div>
                            <p className="text-sm font-bold text-[#191c1e]">{title}</p>
                            <p className="mt-0.5 text-xs text-[#9a97a9]">{desc}</p>
                          </div>
                          <Toggle
                            checked={checked}
                            onChange={() => toggleType(opt.type)}
                            label={title}
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4">
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#8b8898]">
                      Jam Pengiriman
                    </label>
                    <input
                      type="time"
                      value={sendTime}
                      onChange={(e) => setSendTime(e.target.value)}
                      className={inputClass}
                    />
                    <p className="mt-1.5 text-xs text-[#9a97a9]">
                      Berlaku global. Reminder PENDING yang belum terkirim akan mengikuti jam baru;
                      reminder yang sudah terkirim tidak diubah.
                    </p>
                  </div>
                </>
              )}
            </SectionCard>
          </div>

          <div className="space-y-5">
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
import { useState, useEffect } from "react";
import Sidebar from "../../components/layout/Sidebar.jsx"; 
import Header from "../../components/layout/Header.jsx";
import { getDashboardSummary } from "../../services/dashboardService.js";

// Komponen Card Statistik
function StatCard({ title, value, isDanger = false, isSuccess = false }) {
  let textColor = 'text-[#3B2D91]';
  if (isDanger) textColor = 'text-red-600';
  if (isSuccess) textColor = 'text-green-600';

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
      <h3 className="text-[11px] font-medium text-gray-500 tracking-wider uppercase mb-2">{title}</h3>
      <p className={`text-4xl font-bold ${textColor}`}>
        {value !== undefined ? value.toLocaleString('id-ID') : 0}
      </p>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardSummary().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">Loading Dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans flex">
      <Sidebar role="admin" />
      <Header />
      
      {/* UPDATE RESPONSIVE: ml-0 di mobile, ml-[280px] di desktop. Padding disesuaikan */}
      <main className="flex-1 mt-20 md:ml-[280px] p-4 md:p-8 w-full overflow-x-hidden">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm">Pusat kendali operasional harian Billing System.</p>
        </div>

        {/* UPDATE RESPONSIVE: Grid menjadi 2 kolom (mobile), 3 kolom (tablet), 5 kolom (desktop) */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          <StatCard title="TOTAL INVOICE" value={data?.stats?.total_invoices} />
          <StatCard title="PAID INVOICE" value={data?.stats?.paid_invoices} isSuccess />
          <StatCard title="UNPAID INVOICE" value={data?.stats?.unpaid_invoices} isDanger />
          <StatCard title="OVERDUE INVOICE" value={data?.stats?.overdue_invoices} isDanger />
          <StatCard title="PENDING VERIFICATION" value={data?.stats?.pending_payments} />
        </div>

        {/* UPDATE RESPONSIVE: Flex column di mobile/tablet, Flex row di layar lebar */}
        <div className="flex flex-col xl:flex-row gap-6">
          
          {/* LEFT PANEL */}
          <div className="flex-1 space-y-6 w-full">
            <div className="bg-white rounded-xl p-4 md:p-6 border border-gray-100 shadow-sm w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 text-lg">Upcoming Invoice Due</h3>
                <a href="#" className="text-sm text-[#3B2D91] hover:underline whitespace-nowrap ml-4">Lihat Semua</a>
              </div>
              <div className="overflow-x-auto w-full">
                <table className="w-full text-sm text-left min-w-[600px]">
                  <thead className="text-gray-500 uppercase text-xs border-b border-gray-100">
                    <tr>
                      <th className="py-3 font-medium">CLIENT</th>
                      <th className="py-3 font-medium">INVOICE ID</th>
                      <th className="py-3 font-medium">DUE DATE</th>
                      <th className="py-3 font-medium">AMOUNT</th>
                      <th className="py-3 font-medium">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data?.upcoming_invoices?.map((inv, index) => (
                      <tr key={index}>
                        <td className="py-4 text-gray-800 font-medium">{inv.client}</td>
                        <td className="py-4 text-gray-500">{inv.id}</td>
                        <td className="py-4 text-red-500">{inv.due_date}</td>
                        <td className="py-4 font-medium">Rp {inv.amount.toLocaleString('id-ID')}</td>
                        <td className="py-4">
                          <span className="bg-red-50 text-red-500 px-3 py-1 rounded-full text-xs font-medium">
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR PANEL - UPDATE RESPONSIVE: w-full di mobile/tablet, w-[340px] di desktop */}
          <div className="w-full xl:w-[340px] space-y-6">
            
            <div className="bg-white rounded-xl p-4 md:p-6 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800">Pending Verification</h3>
                <span className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-md font-bold">
                  {data?.pending_verifications?.length || 0}
                </span>
              </div>
              <div className="space-y-3 text-sm">
                {data?.pending_verifications?.map((payment, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-indigo-50 text-[#3B2D91] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-bold text-gray-800 truncate">{payment.client}</p>
                        <p className="text-gray-500 text-xs">Rp {payment.amount.toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[#3B2D91] opacity-60 hover:opacity-100 shrink-0">visibility</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 md:p-6 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-4">Reminder Status (Today)</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="flex items-center text-gray-600">
                    <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span> Scheduled
                  </span>
                  <span className="font-bold">{data?.reminders_today?.scheduled}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center text-gray-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span> Sent
                  </span>
                  <span className="font-bold text-green-600">{data?.reminders_today?.sent}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center text-gray-600">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span> Failed
                  </span>
                  <span className="font-bold text-red-500">{data?.reminders_today?.failed}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
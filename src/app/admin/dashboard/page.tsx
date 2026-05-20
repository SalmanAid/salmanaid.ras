"use client";

import { useEffect, useRef, useState } from "react";
import { DollarSign, TrendingUp, Clock, AlertTriangle, FileText, Download } from "lucide-react";

import SummaryOfAspect from "@/components/ui/admin-dashboard/summary_of_aspect";
import AdminDashboard_FinancialOverviewChart from "@/components/ui/admin-dashboard/financial_overview_chart";
import AdminDashboard_RecentActivityTable from "@/components/ui/admin-dashboard/recent_activity_table";
import AdminDashboard_AdminNavbar from "@/components/ui/admin-dashboard/admin_navbar";
import { useAdminDashboardStore } from "@/hooks/adminDashboardStore";
import LoadingPageComponent from "@/components/ui/loading";
import ErrorComponent from "@/components/ui/error";
import jsPDF from "jspdf"
import { svg2pdf } from "svg2pdf.js";
import { exportAnalyticsToExcel } from "@/lib/xlsx_converter";

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

export default function AdminDashboardPage() {
  const chartRef = useRef<HTMLDivElement>(null);
  const statistics = useAdminDashboardStore((state) => state.statistics);
  const analytics = useAdminDashboardStore((state) => state.analytics)
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const response = await fetch("/api/admin/dashboard");
      const result = await response.json();

      if (response.ok) {
        const store = useAdminDashboardStore.getState();
        store.setAnalytics(result.data.analytics);
        store.setStatistics(result.data.statistics);
        store.setPendingLogs(result.data.pending_logs);
      } else {
        setError(result.error || "Gagal memuat data");
      }
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center w-full min-h-screen">
        <LoadingPageComponent />
      </div>
    );
  if (error)
    return (
      <div className="flex justify-center items-center w-full min-h-screen">
        <ErrorComponent message={error} />
      </div>
    );

  const totalDonation = Number(statistics?.totalDonationAmount ?? 0);
  const totalDisbursed = Number(statistics?.totalDisbursed ?? 0);
  const pendingLoans = Number(statistics?.pendingLoans ?? 0);
  const defaultRate = Number(statistics?.defaultRate ?? 0);

  const exportSvgToPdf = async () => {
    const container = document.querySelector(".recharts-wrapper");
    const svgElement = container?.querySelector("svg");

    if (!svgElement) {
      console.error("SVG element not found");
      return;
    }

    const width = svgElement.viewBox.baseVal.width || 800;
    const height = svgElement.viewBox.baseVal.height || 400;
    const pdf = new jsPDF({
      orientation: width > height ? "l" : "p",
      unit: "pt",
      format: [width, height],
    });

    await svg2pdf(svgElement, pdf, {
      x: 0,
      y: 0,
      width: width,
      height: height,
    });

    pdf.save("chart-vector.pdf");
  };

  const downloadAnalyticsXLSX = () => {
    exportAnalyticsToExcel(analytics)
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#F9FAFB]">

      {/* Navbar */}
      <AdminDashboard_AdminNavbar />

      {/* Page Content */}
      <div className="flex flex-col w-full max-w-350 mx-auto px-4 sm:px-6 py-6 gap-6">

        {/* ── Stat Cards ── */}
        {/* Switched from grid-cols-4 to an adaptive responsive column workflow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryOfAspect
            title="Total Pool Funds"
            value={formatRupiah(totalDonation)}
            update_caption="+12.5% from last month"
            icon={DollarSign}
            icon_bg_color="#07B0C8"
            value_color="#07B0C8"
            update_caption_color="#00A63E"
          />

          <SummaryOfAspect
            title="Total Disbursed"
            value={formatRupiah(totalDisbursed)}
            update_caption="+8.2% from last month"
            icon={TrendingUp}
            icon_bg_color="#1e293b"
            value_color="#1e293b"
            update_caption_color="#00A63E"
          />

          <SummaryOfAspect
            title="Pending Applications"
            value={pendingLoans.toString()}
            update_caption="12 new this week"
            icon={Clock}
            icon_bg_color="#FCB82E"
            value_color="#FCB82E"
            update_caption_color="#00A63E"
          />

          <SummaryOfAspect
            title="Default Rate"
            value={`${defaultRate.toFixed(1)}%`}
            update_caption="-0.4% from last month"
            icon={AlertTriangle}
            icon_bg_color="#E7000B"
            value_color="#E7000B"
            update_caption_color="#E7000B"
          />
        </div>

        {/* ── Financial Overview ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          
          {/* Header Action Row Wrapper */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-50 pb-5 mb-4">
            
            {/* Title Block */}
            <div>
              <h2 className="text-lg font-bold text-gray-800">Financial Overview</h2>
              <p className="text-sm text-gray-400 mt-0.5">Monthly donations vs disbursements</p>
            </div>

            {/* Export Actions (Aligned nicely side-by-side or stacked) */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button 
                onClick={exportSvgToPdf}
                className="flex items-center justify-center gap-2 flex-1 sm:flex-none h-10 px-4 rounded-xl border border-gray-200 bg-white text-[12.5px] font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-gray-900 active:scale-95"
              >
                <FileText className="h-4 w-4 text-gray-500" />
                <span>Unduh PDF</span>
              </button>

              <button 
                onClick={downloadAnalyticsXLSX}
                className="flex items-center justify-center gap-2 flex-1 sm:flex-none h-10 px-4 rounded-xl border border-transparent bg-gray-900 text-[12.5px] font-semibold text-white transition hover:bg-gray-800 active:scale-95 shadow-sm"
              >
                <Download className="h-4 w-4 text-gray-300" />
                <span>Unduh XLSX</span>
              </button>
            </div>
            
          </div>

          {/* Graph Render Container Wrapper */}
          <div ref={chartRef} className="w-full overflow-hidden bg-white">
            <AdminDashboard_FinancialOverviewChart />
          </div>
        </div>

        {/* ── Recent Activity ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-800">Recent Activity</h2>
            <p className="text-sm text-gray-400 mt-0.5">Last 5 system activities</p>
          </div>
          <AdminDashboard_RecentActivityTable />
        </div>

      </div>
    </div>
  );
}
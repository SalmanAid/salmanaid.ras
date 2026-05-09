"use client";

import { useEffect, useRef, useState } from "react";
import { DollarSign, TrendingUp, Clock, AlertTriangle } from "lucide-react";

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

// ===============================
// HELPERS
// ===============================
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
    // 1. Target the SVG element inside the Recharts container
    // Recharts usually renders an <svg> tag inside your ref div
    const container = document.querySelector(".recharts-wrapper");
    const svgElement = container?.querySelector("svg");

    if (!svgElement) {
      console.error("SVG element not found");
      return;
    }

    // 2. Create jsPDF instance
    // Use the SVG viewbox dimensions for the PDF page size
    const width = svgElement.viewBox.baseVal.width || 800;
    const height = svgElement.viewBox.baseVal.height || 400;
    const pdf = new jsPDF({
      orientation: width > height ? "l" : "p",
      unit: "pt",
      format: [width, height],
    });

    // 3. Convert SVG to PDF
    // We use the svg2pdf function which takes the element and the pdf instance
    await svg2pdf(svgElement, pdf, {
      x: 0,
      y: 0,
      width: width,
      height: height,
    });

    // 4. Save the result
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
      <div className="flex flex-col w-full max-w-350 mx-auto px-6 py-6 gap-6">

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-4 gap-4">

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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="mb-4">

            {/* container for title + button for downloading pdf */}
            <div className="flex justify-center items-center w-full h-fit">

              {/* conatiner for title */}
              <div className="flex-col justify-center items-center w-[80%] h-fit p-2">
                <h2 className="text-lg font-bold text-gray-800">Financial Overview</h2>
                <p className="text-sm text-gray-400 mt-0.5">Monthly donations vs disbursements</p>
              </div>

              {/* container for the button for exporting to pdf */}
              <div className="flex-col justify-center items-center w-[10%] h-fit p-2">
                <button 
                  onClick={exportSvgToPdf}
                  className="p-4 shadow-lg border border-black border-solid rounded-2xl "
                >
                  Unduh PDF
                </button>
              </div>

              {/* container for the button for exporting to xls */}
              <div className="flex-col justify-center items-center w-[10%] h-fit p-2">
                <button 
                  onClick={downloadAnalyticsXLSX}
                  className="p-4 shadow-lg border border-black border-solid rounded-2xl"
                >
                  Unduh XLSX
                </button>
              </div>
              
            </div>
          </div>


          <div ref={chartRef} className="flex justify-center items-center w-full h-fit bg-white">
            <AdminDashboard_FinancialOverviewChart />
          </div>
        </div>

        {/* ── Recent Activity ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
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

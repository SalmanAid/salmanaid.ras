"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CalendarDays, Clock, DollarSign, FileSpreadsheet, FileText, TrendingUp, X } from "lucide-react";

import SummaryOfAspect from "@/components/ui/admin-dashboard/summary_of_aspect";
import AdminDashboard_FinancialOverviewChart from "@/components/ui/admin-dashboard/financial_overview_chart";
import AdminDashboard_RecentActivityTable from "@/components/ui/admin-dashboard/recent_activity_table";
import AdminDashboard_AdminNavbar from "@/components/ui/admin-dashboard/admin_navbar";
import { useAdminDashboardStore } from "@/hooks/adminDashboardStore";
import LoadingPageComponent from "@/components/ui/loading";
import ErrorComponent from "@/components/ui/error";
import { Button } from "@/components/ui/button";
import {
  exportAnalyticsToExcel,
  exportAnalyticsToPdf,
  getFinancialReportDateBounds,
} from "@/lib/xlsx_converter";

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

export default function AdminDashboardPage() {
  const statistics = useAdminDashboardStore((state) => state.statistics);
  const analytics = useAdminDashboardStore((state) => state.analytics)
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "xlsx">("pdf");
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [exportError, setExportError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchDashboard = async () => {
      try {
        const response = await fetch("/api/admin/dashboard");
        const result = await response.json();

        if (!isMounted) return;

        if (response.ok) {
          const store = useAdminDashboardStore.getState();
          store.setAnalytics(result.data.analytics);
          store.setStatistics(result.data.statistics);
          store.setPendingLogs(result.data.pending_logs);
        } else {
          setError(result.error || "Gagal memuat data");
        }
      } catch {
        if (isMounted) {
          setError("Terjadi kesalahan jaringan");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchDashboard();

    return () => {
      isMounted = false;
    };
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

  const openExportDialog = (format: "pdf" | "xlsx") => {
    if (!analytics) return;

    const bounds = getFinancialReportDateBounds(analytics);
    setExportFormat(format);
    setExportError("");
    setExportStartDate((current) => current || bounds.startDate);
    setExportEndDate((current) => current || bounds.endDate);
    setIsExportDialogOpen(true);
  };

  const closeExportDialog = () => {
    setIsExportDialogOpen(false);
    setExportError("");
  };

  const handleExportReport = () => {
    if (!analytics) return;

    if (exportStartDate && exportEndDate && exportStartDate > exportEndDate) {
      setExportError("Tanggal awal tidak boleh lebih besar dari tanggal akhir.");
      return;
    }

    const fileName = `financial-overview-${exportStartDate || "awal"}-${exportEndDate || "akhir"}`;
    const options = {
      startDate: exportStartDate,
      endDate: exportEndDate,
      fileName,
    };

    if (exportFormat === "pdf") {
      exportAnalyticsToPdf(analytics, options);
    } else {
      exportAnalyticsToExcel(analytics, options);
    }

    closeExportDialog();
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#F9FAFB]">
      {isExportDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="financial-export-title"
            className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-[#07B0C8]">
                  <CalendarDays className="size-5" />
                </div>
                <div>
                  <h3 id="financial-export-title" className="text-base font-bold text-slate-900">
                    Atur periode laporan
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    File {exportFormat.toUpperCase()} akan berisi legend grafik dan tabel detail dengan periode yang dipilih.
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Data grafik tersedia per bulan, jadi tanggal yang dipilih akan mencakup bulan terkait.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeExportDialog}
                aria-label="Tutup dialog export"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-slate-900"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                Tanggal awal
                <input
                  type="date"
                  value={exportStartDate}
                  onChange={(event) => setExportStartDate(event.target.value)}
                  className="h-10 rounded-lg border border-gray-200 px-3 text-sm font-medium text-slate-900 outline-none transition focus:border-[#07B0C8] focus:ring-3 focus:ring-cyan-100"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                Tanggal akhir
                <input
                  type="date"
                  value={exportEndDate}
                  onChange={(event) => setExportEndDate(event.target.value)}
                  className="h-10 rounded-lg border border-gray-200 px-3 text-sm font-medium text-slate-900 outline-none transition focus:border-[#07B0C8] focus:ring-3 focus:ring-cyan-100"
                />
              </label>
            </div>

            {exportError && (
              <p className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {exportError}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={closeExportDialog}
                className="h-10 border-gray-200 text-slate-700 hover:bg-gray-50"
              >
                Batal
              </Button>
              <Button
                type="button"
                size="lg"
                onClick={handleExportReport}
                className="h-10 bg-slate-900 text-white hover:bg-slate-800"
              >
                {exportFormat === "pdf" ? <FileText className="size-4" /> : <FileSpreadsheet className="size-4" />}
                Unduh {exportFormat.toUpperCase()}
              </Button>
            </div>
          </div>
        </div>
      )}

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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Financial Overview</h2>
              <p className="text-sm text-gray-400 mt-0.5">Monthly donations vs disbursements</p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => openExportDialog("pdf")}
                className="h-10 justify-center border-gray-200 bg-white px-4 text-slate-700 shadow-sm hover:bg-gray-50"
              >
                <FileText className="size-4 text-red-600" />
                PDF
              </Button>
              <Button
                type="button"
                size="lg"
                onClick={() => openExportDialog("xlsx")}
                className="h-10 justify-center bg-[#07B0C8] px-4 text-white shadow-sm hover:bg-[#0698AD]"
              >
                <FileSpreadsheet className="size-4" />
                XLSX
              </Button>
            </div>
          </div>

          <div className="flex justify-center items-center w-full h-fit bg-white">
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
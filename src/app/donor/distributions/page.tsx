"use client"

import { useEffect, useState, useMemo } from "react";
import DonorDashboard_RecentDistributionTable from "@/components/ui/donor-dashboard/recent_distribution_table";
import DonorDashboard_DonorNavbar from "@/components/ui/donor-dashboard/donor_navbar";
import { AdminSearch } from "@/components/ui/admin-search";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatCurrency } from "@/lib/utils";

const formatDate = (dateIso: string) => {
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

export default function DonorDistributionsPage() {
  const maxItemsInPage = 10;
  
  const [distributions, setDistributions] = useState<any[]>([]);
  const [currentPageNumber, setCurrentPageNumber] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [totalItems, setTotalItems] = useState(0);
  const debouncedSearch = useDebouncedValue(search);

  const maxPageNumber = Math.max(1, Math.ceil(totalItems / maxItemsInPage));

  useEffect(() => {
    const controller = new AbortController();

    const fetchDistributions = async () => {
      setIsLoading(true);
      const baseUrl = '/api/donors/distributions';
      const start = (currentPageNumber - 1) * maxItemsInPage;
      const end = start + maxItemsInPage;

      const params = new URLSearchParams({
        start: start.toString(),
        end: end.toString(),
      });

      if (statusFilter) {
        params.append("status", statusFilter);
      }
      if (debouncedSearch) {
        params.append("search", debouncedSearch);
      }

      try {
        const response = await fetch(`${baseUrl}?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const result = await response.json();
        if (result.success) {
          setDistributions(result.data.distributions || []);
          setTotalItems(result.data.total || 0);
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error("Fetch error:", error);
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    void fetchDistributions();
    return () => controller.abort();
  }, [currentPageNumber, debouncedSearch, statusFilter]);

  const handleFilterChange = (status: string | undefined) => {
    setStatusFilter(status);
    setCurrentPageNumber(1);
  };

  const getTabColor = (value: string | undefined) => {
    if (statusFilter !== value) return "text-gray-500";
    switch (value) {
      case "ALLOCATED": return "text-[#3B82F6] border-[#3B82F6]";
      case "RETURNED": return "text-[#10B981] border-[#10B981]";
      default: return "text-[#07B0C8] border-[#07B0C8]";
    }
  };

  const tableRows = useMemo(() => distributions.map((distribution) => ({
    id: distribution.id,
    date: formatDate(distribution.allocatedAt),
    beneficiaryName: distribution.beneficiaryName,
    programName: distribution.description,
    amount: formatCurrency(distribution.allocatedAmount),
    status: distribution.status,
  })), [distributions]);

  return (
    <div className="flex flex-col justify-start items-center w-full min-h-screen bg-[#F9FAFB]">
      <div className="w-full">
        <DonorDashboard_DonorNavbar />
      </div>

      <div className="w-full max-w-350 px-4 sm:px-6 pt-6 sm:pt-10 pb-4">
        <h1 className="text-2xl sm:text-4xl font-bold text-[#111827] tracking-tight">
          Riwayat Distribusi
        </h1>
        <p className="text-sm sm:text-lg text-gray-500 mt-1.5 sm:mt-2 max-w-2xl">
          Pantau semua distribusi dana Anda kepada peminjam dan status saat ini.
        </p>
      </div>

      <div className="flex flex-col w-full max-w-350 px-4 sm:px-6 py-2 sm:py-4">
        <div className="mb-6 flex w-full flex-col gap-4 border-b border-gray-200 md:flex-row md:items-end md:justify-between">
          <div className="flex gap-1 overflow-x-auto no-scrollbar scroll-smooth -mb-px sm:gap-4">
              {[
                { label: "Semua", value: undefined },
                { label: "Dialokasikan", value: "ALLOCATED" },
                { label: "Dikembalikan", value: "RETURNED" },
              ].map((tab) => (
                <button
                  key={tab.label}
                  onClick={() => handleFilterChange(tab.value)}
                  className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-bold transition-all border-b-2 whitespace-nowrap ${getTabColor(tab.value)} ${
                    statusFilter !== tab.value ? "border-transparent text-gray-500 hover:text-gray-700" : ""
                  }`}
                >
                  {tab.label}
                </button>
              ))}
          </div>

          <AdminSearch
            value={search}
            onChange={(value) => {
              setSearch(value);
              setCurrentPageNumber(1);
            }}
            placeholder="Cari penerima atau tujuan pinjaman..."
            className="mb-3 w-full md:max-w-md"
          />
        </div>

        <div className="w-full mb-6">
          <DonorDashboard_RecentDistributionTable rows={tableRows} isLoading={isLoading} hideTitle={true} />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center w-full py-4 bg-white px-5 sm:px-6 rounded-xl shadow-sm border border-gray-100">
          <div className="text-xs sm:text-sm text-gray-500 font-medium text-center sm:text-left">
            {totalItems === 0 ? (
              "Tidak ada distribusi"
            ) : (
              <>
                Menampilkan <span className="text-slate-900 font-bold">{((currentPageNumber - 1) * maxItemsInPage) + 1}</span> hingga{" "}
                <span className="text-slate-900 font-bold">{Math.min(currentPageNumber * maxItemsInPage, totalItems)}</span> dari{" "}
                <span className="text-slate-900 font-bold">{totalItems}</span> distribusi
              </>
            )}
          </div>

          <div className="flex items-center justify-center gap-2">
            <button
              disabled={currentPageNumber === 1}
              onClick={() => setCurrentPageNumber((prev) => prev - 1)}
              className="px-3.5 py-2 text-xs sm:text-sm font-bold text-gray-600 bg-gray-50 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-100 transition-colors active:scale-95"
            >
              Sebelumnya
            </button>

            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 text-white text-xs sm:text-sm font-bold shadow-sm">
              {currentPageNumber}
            </div>

            <button
              disabled={currentPageNumber >= maxPageNumber}
              onClick={() => setCurrentPageNumber((prev) => prev + 1)}
              className="px-3.5 py-2 text-xs sm:text-sm font-bold text-gray-600 bg-gray-50 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-100 transition-colors active:scale-95"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

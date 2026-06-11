"use client"

import { useLoanRequestStore } from "@/hooks/loanRequestStore";
import { useEffect, useState } from "react";
import LoanRequest_LoanRequestsTable from "@/components/ui/loan-request/loan_request_table";
import AdminDashboard_AdminNavbar from "@/components/ui/admin-dashboard/admin_navbar";
import { AdminSearch } from "@/components/ui/admin-search";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export default function AdminLoanRequestPage() {
  const maxItemsInPage = 10;

  const setLoans = useLoanRequestStore((state) => state.setLoans);

  const [currentPageNumber, setCurrentPageNumber] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [totalItems, setTotalItems] = useState(0);
  const debouncedSearch = useDebouncedValue(search);

  const maxPageNumber = Math.max(1, Math.ceil(totalItems / maxItemsInPage));

  useEffect(() => {
    const controller = new AbortController();

    const fetchLoanApplication = async () => {
      setIsLoading(true);
      const baseUrl = '/api/loan-applications';
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
        setLoans(result.data.loans || []);
        setTotalItems(result.data.total || 0);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error("Fetch error:", error);
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    void fetchLoanApplication();
    return () => controller.abort();
  }, [currentPageNumber, debouncedSearch, statusFilter, setLoans]);

  const handleFilterChange = (status: string | undefined) => {
    setStatusFilter(status);
    setCurrentPageNumber(1);
  };

  // Helper to determine the active tab color based on your dict
  const getTabColor = (value: string | undefined) => {
    if (statusFilter !== value) return "text-gray-500"; // Inactive color

    switch (value) {
      case "PENDING": return "text-[#BB4D00] border-[#BB4D00]";
      case "APPROVED": return "text-[#007A55] border-[#007A55]";
      case "REJECTED": return "text-[#C10007] border-[#C10007]";
      default: return "text-[#00B5D8] border-[#00B5D8]"; // "All" color
    }
  };

  return (
    <div className="flex flex-col justify-start items-center w-full min-h-screen bg-[#F9FAFB]">
      <AdminDashboard_AdminNavbar />

      {/* Header Container - Replaced absolute w-[90%] with fluid bounding constraints */}
      <div className="w-full max-w-350 px-4 sm:px-6 pt-6 sm:pt-10 pb-4">
        <h1 className="text-2xl sm:text-4xl font-bold text-[#1E293B] tracking-tight">
          Daftar Pengajuan Pinjaman
        </h1>
        <p className="text-sm sm:text-lg text-gray-500 mt-1.5 sm:mt-2 max-w-2xl">
          Atur dan review pengajuan pinjaman oleh mahasiswa dan dosen.
        </p>
      </div>

      {/* Main Content Area Container */}
      <div className="flex flex-col w-full max-w-350 px-4 sm:px-6 py-2 sm:py-4">
        <AdminSearch
          value={search}
          onChange={(value) => {
            setSearch(value);
            setCurrentPageNumber(1);
          }}
          placeholder="Cari nama, email, ID, deskripsi, donor, atau nominal..."
          className="mb-5 max-w-2xl"
        />
        
        {/* ── FILTER TABS (Refactored for horizontal scroll touch behavior on mobile) ── */}
        <div className="w-full border-b border-gray-200 mb-6">
          <div className="flex gap-1 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth -mb-px">
            {[
              { label: "All", value: undefined },
              { label: "Pending", value: "PENDING" },
              { label: "Approved", value: "APPROVED" },
              { label: "Rejected", value: "REJECTED" },
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
        </div>

        {/* Dynamic Inner Table Rendering Element Frame */}
        <div className="w-full mb-6">
          <LoanRequest_LoanRequestsTable isLoading={isLoading} />
        </div>

        {/* ── PAGINATION CONTROLS (Refactored from single layout row to responsive stack blocks) ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center w-full py-4 bg-white px-5 sm:px-6 rounded-xl shadow-sm border border-gray-100">
          
          {/* Item Meta Counter Output Block */}
          <div className="text-xs sm:text-sm text-gray-500 font-medium text-center sm:text-left">
            {totalItems === 0 ? (
              "No data to show"
            ) : (
              <>
                Showing <span className="text-slate-900 font-bold">{((currentPageNumber - 1) * maxItemsInPage) + 1}</span> to{" "}
                <span className="text-slate-900 font-bold">{Math.min(currentPageNumber * maxItemsInPage, totalItems)}</span> of{" "}
                <span className="text-slate-900 font-bold">{totalItems}</span> items
              </>
            )}
          </div>

          {/* Pagination Interactive Navigation Button Group */}
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

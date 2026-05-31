"use client"

import { useLoanStore } from "@/hooks/loanStore";
import { useEffect, useState } from "react";
import LoanRequest_LoanRequestsTable from "@/components/ui/loan-request/loan_request_table";
import AdminDashboard_AdminNavbar from "@/components/ui/admin-dashboard/admin_navbar";
import Monitoring_LoanMonitoringTable from "@/components/ui/monitoring/loan_monitoring_table";
import Monitoring_ManualSettlementCard from "@/components/ui/monitoring/manual_settlement_card";

export default function AdminMonitoringPage() {
  const maxItemsInPage = 10;

	const isManualSettlementCardOpen = useLoanStore((state) => (state.isManualSettlementCardOpen))

  const loans = useLoanStore((state) => state.loans);
  const setLoans = useLoanStore((state) => state.setLoans);

  const [currentPageNumber, setCurrentPageNumber] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const totalItems = loans.length || 0;
  const maxPageNumber = Math.max(1, Math.ceil(totalItems / maxItemsInPage));

  useEffect(() => {
    const fetchLoans = async () => {
      setIsLoading(true);
      const baseUrl = '/api/loans';
      const start = (currentPageNumber - 1) * maxItemsInPage;
      const end = start + maxItemsInPage;

      const params = new URLSearchParams({
        start: start.toString(),
        end: end.toString(),
      });

      if (statusFilter) {
        params.append("status", statusFilter);
      }

      try {
        const response = await fetch(`${baseUrl}?${params}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const result = await response.json();
        setLoans(result.data.loans || []);
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLoans();
  }, [currentPageNumber, statusFilter, setLoans]);

  const handleFilterChange = (status: string | undefined) => {
    setStatusFilter(status);
    setCurrentPageNumber(1);
  };

  // Helper to determine the active tab color based on your dict
  const getTabColor = (value: string | undefined) => {
    if (statusFilter !== value) return "text-gray-500"; // Inactive color

    switch (value) {
      case "FORGIVEN": return "text-[#BB4D00] border-[#BB4D00]";
      case "ACTIVE" : return "text-[#007A55] border-[#007A55]";
      case "PAID" : return "text-[#007A55] border-[#007A55]";
      case "DEFAULTED": return "text-[#C10007] border-[#C10007]";
      default: return "text-[#00B5D8] border-[#00B5D8]"; // "All" color
    }
  };

  return (
    <div className="flex flex-col justify-start items-center w-full min-h-screen bg-[#F9FAFB]">

		{isManualSettlementCardOpen && (
			<div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
				<Monitoring_ManualSettlementCard />
			</div>
		)}
		<AdminDashboard_AdminNavbar />

		<div className="w-[90%] pt-10 pb-4">
			<h1 className="text-4xl font-bold text-[#1E293B]">Daftar Pinjaman</h1>
			<p className="text-lg text-gray-500 mt-2">
			Atur pinjaman untuk mahasiswa dan dosen.
			</p>
		</div>

		<div className="flex flex-col w-[90%] py-4">
			{/* Filter Tabs with Hardcoded Dictionary Colors */}
			<div className="w-full border-b border-gray-200 mb-6">
				<div className="flex gap-1 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth -mb-px">
					{[
						{ label: "All", value: undefined },
						{ label: "Forgiven", value: "FORGIVEN" },
						{ label: "Paid", value: "PAID" },
						{ label: "Active", value: "ACTIVE" },
						{ label: "Defaulted", value: "DEFAULTED" },
					].map((tab) => (
					<button
						key={tab.label}
						onClick={() => handleFilterChange(tab.value)}
						className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 ${getTabColor(tab.value)} ${statusFilter !== tab.value ? "border-transparent hover:text-gray-700" : ""
							}`}
					>
						{tab.label}
					</button>
					))}
				</div>
			</div>	

				<div className="w-full mb-6">
					<Monitoring_LoanMonitoringTable isLoading={isLoading} />
				</div>

				{/* Pagination UI */}
				<div className="flex justify-between items-center w-full py-4 bg-white px-6 rounded-xl shadow-sm border border-gray-100">
				<div className="text-sm text-gray-500 font-medium">
					{totalItems === 0 ? (
					"No data to show"
					) : (
					<>
						Menampilkan <span className="text-slate-900 font-bold">{((currentPageNumber - 1) * maxItemsInPage) + 1}</span> hingga{" "}
						<span className="text-slate-900 font-bold">{Math.min(currentPageNumber * maxItemsInPage, totalItems)}</span> dari{" "}
						<span className="text-slate-900 font-bold">{totalItems}</span> item
					</>
					)}
				</div>

				<div className="flex items-center gap-2">
					<button
					disabled={currentPageNumber === 1}
					onClick={() => setCurrentPageNumber((prev) => prev - 1)}
					className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-50 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-100 transition-colors"
					>
					Sebelumnya
					</button>

					<div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 text-white text-sm font-bold">
					{currentPageNumber}
					</div>

					<button
					disabled={currentPageNumber >= maxPageNumber}
					onClick={() => setCurrentPageNumber((prev) => prev + 1)}
					className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-50 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-100 transition-colors"
					>
					Selanjutnya
					</button>
				</div>

			</div>
		</div>
    </div>
  );
}
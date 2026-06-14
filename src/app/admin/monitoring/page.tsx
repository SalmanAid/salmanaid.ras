"use client"

import { useLoanStore } from "@/hooks/loanStore";
import { useEffect, useState } from "react";
import AdminDashboard_AdminNavbar from "@/components/ui/admin-dashboard/admin_navbar";
import Monitoring_LoanMonitoringTable from "@/components/ui/monitoring/loan_monitoring_table";
import Monitoring_ManualSettlementCard from "@/components/ui/monitoring/manual_settlement_card";
import { AdminSearch } from "@/components/ui/admin-search";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import Monitoring_UserMonitoringTable from "@/components/ui/monitoring/user_monitoring_table";
import { formatCurrency } from "@/lib/utils";
import { X } from "lucide-react";

export default function AdminMonitoringPage() {
  const maxItemsInPage = 10;

	const isManualSettlementCardOpen = useLoanStore((state) => (state.isManualSettlementCardOpen))

  const setLoans = useLoanStore((state) => state.setLoans);

  const [currentPageNumber, setCurrentPageNumber] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [totalItems, setTotalItems] = useState(0);
  const debouncedSearch = useDebouncedValue(search);

  const [viewMode, setViewMode] = useState<"LOANS" | "USERS">("LOANS");
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<any | null>(null);

  const maxPageNumber = Math.max(1, Math.ceil(totalItems / maxItemsInPage));

  useEffect(() => {
    const controller = new AbortController();

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

    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/admin/monitoring/users', { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        setUsers(result.data || []);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error("Fetch users error:", error);
        }
      }
    };

    if (viewMode === "LOANS") {
      void fetchLoans();
    } else {
      setIsLoading(true);
      fetchUsers().finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    }

    return () => controller.abort();
  }, [currentPageNumber, debouncedSearch, statusFilter, setLoans, viewMode]);

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
			{/* Main View Mode Tabs */}
			<div className="flex gap-4 mb-4 border-b border-gray-200">
				<button
					onClick={() => { setViewMode("LOANS"); setCurrentPageNumber(1); setSearch(""); }}
					className={`pb-3 px-2 text-sm font-bold border-b-2 transition-all ${
						viewMode === "LOANS" ? "border-[#00B5D8] text-[#00B5D8]" : "border-transparent text-gray-500 hover:text-gray-700"
					}`}
				>
					Semua Pinjaman
				</button>
				<button
					onClick={() => { setViewMode("USERS"); setSearch(""); }}
					className={`pb-3 px-2 text-sm font-bold border-b-2 transition-all ${
						viewMode === "USERS" ? "border-[#00B5D8] text-[#00B5D8]" : "border-transparent text-gray-500 hover:text-gray-700"
					}`}
				>
					Berdasarkan Pengguna
				</button>
			</div>

			{viewMode === "LOANS" && (
			<>
			{/* Filter Tabs with Hardcoded Dictionary Colors */}
			<div className="mb-6 flex w-full flex-col gap-4 border-b border-gray-200 md:flex-row md:items-end md:justify-between">
				<div className="flex gap-1 overflow-x-auto no-scrollbar scroll-smooth -mb-px sm:gap-4">
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

        <AdminSearch
          value={search}
          onChange={(value) => {
            setSearch(value);
            setCurrentPageNumber(1);
          }}
          placeholder="Cari peminjam, email, ID, deskripsi, donor, pembayaran, atau nominal..."
          className="mb-3 w-full md:max-w-md"
        />
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

			</>
			)}

			{viewMode === "USERS" && (
			<>
				<div className="mb-6 flex w-full flex-col gap-4 border-b border-gray-200 md:flex-row md:items-end md:justify-end">
					<AdminSearch
					  value={search}
					  onChange={(value) => setSearch(value)}
					  placeholder="Cari peminjam, email..."
					  className="mb-3 w-full md:max-w-md"
					/>
				</div>

				<div className="w-full mb-6">
					<Monitoring_UserMonitoringTable 
						users={users.filter(u => 
							u.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
							u.email?.toLowerCase().includes(debouncedSearch.toLowerCase())
						)} 
						isLoading={isLoading} 
						onUserClick={(user) => setSelectedUserForDetail(user)}
					/>
				</div>
			</>
			)}

		</div>

		{/* User Detail Modal */}
		{selectedUserForDetail && (
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
				<div className="w-full max-w-2xl bg-white rounded-xl shadow-lg flex flex-col max-h-[90vh]">
					<div className="flex items-center justify-between border-b p-6">
						<h2 className="text-xl font-bold">Riwayat Pinjaman: {selectedUserForDetail.name}</h2>
						<button onClick={() => setSelectedUserForDetail(null)} className="text-gray-500 hover:text-gray-800 transition">
							<X size={20} />
						</button>
					</div>
					<div className="overflow-y-auto p-6 flex flex-col gap-4">
						{selectedUserForDetail.loans.length === 0 ? (
							<p className="text-gray-500 text-center py-4">Pengguna ini belum memiliki pinjaman.</p>
						) : (
							selectedUserForDetail.loans.map((loan: any) => (
								<div key={loan.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex flex-col gap-2">
									<div className="flex justify-between items-center">
										<span className="font-bold text-[#1E293B]">{formatCurrency(Number(loan.approvedAmount))}</span>
										<span className={`text-xs font-bold px-2 py-1 rounded-full ${
											loan.status === "PAID" ? "bg-green-100 text-green-800" :
											loan.status === "FORGIVEN" ? "bg-purple-100 text-purple-800" :
											loan.status === "DEFAULTED" ? "bg-red-100 text-red-800" :
											"bg-blue-100 text-blue-800"
										}`}>
											{loan.status}
										</span>
									</div>
									<div className="text-sm text-gray-600 flex justify-between">
										<span>Sisa Pembayaran: {formatCurrency(Number(loan.approvedAmount) - Number(loan.totalPaid || 0))}</span>
										<span>Disetujui: {new Date(loan.approvedAt).toLocaleDateString("id-ID")}</span>
									</div>
								</div>
							))
						)}
					</div>
				</div>
			</div>
		)}

    </div>
  );
}

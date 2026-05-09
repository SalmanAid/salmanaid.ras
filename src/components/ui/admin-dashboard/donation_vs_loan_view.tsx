"use client";

import { useEffect, useState } from "react";
import { exportToCSV, exportToXLSX } from "@/lib/export-utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import jsPDF from "jspdf";

interface AggregatedData {
  month: string;
  totalDonation: number;
  totalLoan: number;
}

const formatYAxis = (value: number): string => {
  if (value === 0) return "Rp 0";
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)}M`;
  if (value >= 1_000_000) return `Rp ${Math.round(value / 1_000_000)}Jt`;
  if (value >= 1_000) return `Rp ${Math.round(value / 1_000)}rb`;
  return `Rp ${value}`;
};

export default function DonationVsLoanView() {
  const [data, setData] = useState<AggregatedData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/statistics')
      .then(res => res.json())
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          const formattedData = res.data.map((item: any) => ({
            month: item.month,
            totalDonation: Number(item.totalDonation) || 0,
            totalLoan: Number(item.totalLoan) || 0,
          }));
          setData(formattedData);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleExportChartPDF = () => {
    if (data.length === 0) return;

    const pdf = new jsPDF("l", "pt", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // 1. Header
    pdf.setFontSize(18);
    pdf.setTextColor(40, 40, 40);
    pdf.text("Laporan Analitik Donasi & Pinjaman", 40, 50);
    
    pdf.setFontSize(10);
    pdf.setTextColor(120, 120, 120);
    pdf.text(`Salman Aid - Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 40, 70);

    // 2. Setting Area Grafik
    const chartX = 60;
    const chartY = 130;
    const chartW = pageWidth - 120;
    const chartH = 220;

    // Garis Sumbu X
    pdf.setDrawColor(150, 150, 150);
    pdf.line(chartX, chartY + chartH, chartX + chartW, chartY + chartH);

    // Cari nilai tertinggi untuk skala
    const maxVal = Math.max(...data.map(d => Math.max(d.totalDonation, d.totalLoan)), 100000);
    const colWidth = chartW / data.length;

    data.forEach((item, i) => {
      const xStart = chartX + (i * colWidth);
      const barW = colWidth * 0.3;

      // --- Batang Donasi (#07B0C8) ---
      const hDon = (item.totalDonation / maxVal) * chartH;
      const xDon = xStart + (colWidth * 0.15);
      pdf.setFillColor(7, 176, 200);
      pdf.rect(xDon, chartY + chartH - hDon, barW, hDon, 'F');
      
      // Tampilkan Angka Donasi (di atas batang)
      pdf.setFontSize(8);
      pdf.setTextColor(7, 176, 200);
      const txtDon = item.totalDonation >= 1000 ? `${(item.totalDonation/1000).toFixed(1)}rb` : item.totalDonation.toString();
      pdf.text(txtDon, xDon + (barW/2), chartY + chartH - hDon - 5, { align: 'center' });

      // --- Batang Pinjaman (#FCB82E) ---
      const hLoan = (item.totalLoan / maxVal) * chartH;
      const xLoan = xDon + barW + 4;
      pdf.setFillColor(252, 184, 46);
      pdf.rect(xLoan, chartY + chartH - hLoan, barW, hLoan, 'F');

      // Tampilkan Angka Pinjaman (di atas batang)
      pdf.setTextColor(210, 150, 0); // Warna agak gelap sedikit biar kebaca
      const txtLoan = item.totalLoan >= 1000 ? `${(item.totalLoan/1000).toFixed(1)}rb` : item.totalLoan.toString();
      pdf.text(txtLoan, xLoan + (barW/2), chartY + chartH - hLoan - 5, { align: 'center' });

      // --- Label Bulan ---
      pdf.setFontSize(9);
      pdf.setTextColor(80, 80, 80);
      pdf.text(item.month, xStart + (colWidth * 0.3), chartY + chartH + 20);
    });

    // 3. Legend
    pdf.setFillColor(7, 176, 200);
    pdf.rect(40, pageHeight - 50, 10, 10, 'F');
    pdf.setTextColor(40, 40, 40);
    pdf.text("Total Donasi (Rp)", 55, pageHeight - 42);

    pdf.setFillColor(252, 184, 46);
    pdf.rect(160, pageHeight - 50, 10, 10, 'F');
    pdf.text("Total Pinjaman (Rp)", 175, pageHeight - 42);

    pdf.save(`Laporan_Analitik_${new Date().getTime()}.pdf`);
  };

  if (loading) return <div className="p-10 text-center text-gray-400">Memuat data...</div>;

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Analitik Donasi & Pinjaman</h2>
          <p className="text-sm text-gray-400">Data real-time perbandingan saldo</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportToCSV(data, 'Data')} className="px-4 py-2 bg-white border rounded-xl text-sm font-medium hover:bg-gray-50">CSV</button>
          <button onClick={() => exportToXLSX(data, 'Data')} className="px-4 py-2 bg-white border rounded-xl text-sm font-medium hover:bg-gray-50">XLSX</button>
        </div>
      </div>

      <div className="mb-8 p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-semibold text-gray-700 uppercase">Visualisasi</h3>
          <button
            onClick={handleExportChartPDF}
            className="px-4 py-2 bg-[#07B0C8] text-white rounded-xl hover:bg-[#0698ad] text-sm font-medium shadow-sm transition-all"
          >
            Unduh Grafik (PDF)
          </button>
        </div>
        
        <div className="w-full h-[400px] bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} tickFormatter={formatYAxis} />
              <Tooltip cursor={{ fill: '#f9fafb' }} />
              <Legend verticalAlign="top" align="right" />
              <Bar dataKey="totalDonation" name="Total Donasi" fill="#07B0C8" radius={[4, 4, 0, 0]} barSize={35} />
              <Bar dataKey="totalLoan" name="Total Pinjaman" fill="#FCB82E" radius={[4, 4, 0, 0]} barSize={35} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
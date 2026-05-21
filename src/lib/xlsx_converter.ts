import jsPDF from "jspdf"
import * as XLSX from "xlsx"

import type { Analytics } from "@/types/analytics"

export type FinancialReportDateRange = {
  startDate?: string
  endDate?: string
}

export type FinancialReportRow = {
  month: string
  label: string
  donations: number
  disbursement: number
  balance: number
}

type FinancialReportExportOptions = FinancialReportDateRange & {
  fileName?: string
}

const DONATION_COLOR = "#07B0C8"
const DISBURSEMENT_COLOR = "#FCB82E"
const TEXT_COLOR = "#1F2937"
const MUTED_TEXT_COLOR = "#6B7280"
const BORDER_COLOR = "#E5E7EB"

const MONTH_LABELS: Record<string, string> = {
  "01": "Jan",
  "02": "Feb",
  "03": "Mar",
  "04": "Apr",
  "05": "Mei",
  "06": "Jun",
  "07": "Jul",
  "08": "Agu",
  "09": "Sep",
  "10": "Okt",
  "11": "Nov",
  "12": "Des",
}

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat("id-ID")

const getMonthLabel = (yyyyMM: string) => {
  const [year, month] = yyyyMM.split("-")
  return `${MONTH_LABELS[month] ?? month} ${year}`
}

const formatRupiah = (value: number) => rupiahFormatter.format(value)

const formatCompactRupiah = (value: number) => {
  if (value === 0) return "Rp 0"
  if (value >= 1_000_000_000) return `Rp ${numberFormatter.format(Math.round(value / 1_000_000_000))} M`
  if (value >= 1_000_000) return `Rp ${numberFormatter.format(Math.round(value / 1_000_000))} jt`
  if (value >= 1_000) return `Rp ${numberFormatter.format(Math.round(value / 1_000))} rb`
  return `Rp ${numberFormatter.format(value)}`
}

const formatDateLabel = (date?: string) => {
  if (!date) return ""

  const [year, month, day] = date.split("-")
  if (!year || !month || !day) return date

  return `${Number(day)} ${MONTH_LABELS[month] ?? month} ${year}`
}

const normalizeFileName = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "")
    .toLowerCase()

export const getFinancialReportDateBounds = (analytics: Analytics | null) => {
  const rows = buildFinancialReportRows(analytics)

  if (rows.length === 0) {
    const today = new Date().toISOString().slice(0, 10)
    return { startDate: today, endDate: today }
  }

  const firstMonth = rows[0].month
  const lastMonth = rows[rows.length - 1].month

  return {
    startDate: `${firstMonth}-01`,
    endDate: `${lastMonth}-${new Date(Number(lastMonth.slice(0, 4)), Number(lastMonth.slice(5, 7)), 0).getDate()}`,
  }
}

export const buildFinancialReportRows = (
  analytics: Analytics | null,
  range: FinancialReportDateRange = {}
): FinancialReportRow[] => {
  if (!analytics) return []

  const map = new Map<string, FinancialReportRow>()

  analytics.monthlyDonations.forEach((item) => {
    map.set(item.month, {
      month: item.month,
      label: getMonthLabel(item.month),
      donations: Number(item.total ?? 0),
      disbursement: 0,
      balance: Number(item.total ?? 0),
    })
  })

  analytics.monthlyDisbursement.forEach((item) => {
    const total = Number(item.total ?? 0)
    const current = map.get(item.month)

    if (current) {
      current.disbursement = total
      current.balance = current.donations - total
      return
    }

    map.set(item.month, {
      month: item.month,
      label: getMonthLabel(item.month),
      donations: 0,
      disbursement: total,
      balance: -total,
    })
  })

  const startMonth = range.startDate?.slice(0, 7)
  const endMonth = range.endDate?.slice(0, 7)

  return Array.from(map.values())
    .sort((a, b) => a.month.localeCompare(b.month))
    .filter((row) => (!startMonth || row.month >= startMonth) && (!endMonth || row.month <= endMonth))
}

const getPeriodLabel = (rows: FinancialReportRow[], range: FinancialReportDateRange) => {
  if (range.startDate || range.endDate) {
    const start = formatDateLabel(range.startDate) || "Awal data"
    const end = formatDateLabel(range.endDate) || "Akhir data"
    return `${start} - ${end}`
  }

  if (rows.length === 0) return "Tidak ada data"
  return `${rows[0].label} - ${rows[rows.length - 1].label}`
}

const getTotals = (rows: FinancialReportRow[]) =>
  rows.reduce(
    (total, row) => ({
      donations: total.donations + row.donations,
      disbursement: total.disbursement + row.disbursement,
      balance: total.balance + row.balance,
    }),
    { donations: 0, disbursement: 0, balance: 0 }
  )

const getSpreadsheetBar = (value: number, maxValue: number) => {
  if (value <= 0) return ""

  return "#".repeat(Math.max(1, Math.round((value / maxValue) * 28)))
}

export const exportAnalyticsToExcel = (
  analytics: Analytics | null,
  options: FinancialReportExportOptions = {}
) => {
  const rows = buildFinancialReportRows(analytics, options)
  const totals = getTotals(rows)
  const periodLabel = getPeriodLabel(rows, options)
  const maxChartValue = Math.max(...rows.flatMap((row) => [row.donations, row.disbursement]), 1)
  const workbook = XLSX.utils.book_new()

  const reportRows = [
    ["Financial Overview Report"],
    ["Periode", periodLabel],
    ["Dibuat pada", new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" }).format(new Date())],
    [],
    ["Legenda Grafik"],
    ["Seri", "Warna", "Makna", "Total periode"],
    ["Monthly Donations", DONATION_COLOR, "Total donasi yang masuk pada bulan tersebut", totals.donations],
    ["Monthly Disbursements", DISBURSEMENT_COLOR, "Total dana yang disalurkan pada bulan tersebut", totals.disbursement],
    ["Net Balance", "#111827", "Donasi dikurangi penyaluran pada bulan tersebut", totals.balance],
    [],
    ["Grafik Nilai"],
    ["Bulan", "Monthly Donations", "Donations Bar", "Monthly Disbursements", "Disbursements Bar"],
    ...rows.map((row) => [
      row.label,
      row.donations,
      getSpreadsheetBar(row.donations, maxChartValue),
      row.disbursement,
      getSpreadsheetBar(row.disbursement, maxChartValue),
    ]),
    [],
    ["Detail Nilai Grafik"],
    ["Bulan", "Monthly Donations", "Monthly Disbursements", "Net Balance"],
    ...rows.map((row) => [row.label, row.donations, row.disbursement, row.balance]),
  ]

  if (rows.length === 0) {
    reportRows.push(["Tidak ada data pada periode yang dipilih."])
  }

  const worksheet = XLSX.utils.aoa_to_sheet(reportRows)
  worksheet["!cols"] = [{ wch: 22 }, { wch: 22 }, { wch: 34 }, { wch: 24 }, { wch: 34 }]

  const currencyFormat = '"Rp" #,##0;-"Rp" #,##0'
  Object.keys(worksheet).forEach((cellAddress) => {
    if (cellAddress.startsWith("!")) return

    const cell = worksheet[cellAddress]
    if (typeof cell.v === "number") {
      cell.z = currencyFormat
    }
  })

  XLSX.utils.book_append_sheet(workbook, worksheet, "Financial Overview")
  XLSX.writeFile(workbook, `${normalizeFileName(options.fileName ?? "financial-overview-report")}.xlsx`)
}

const drawRoundedRect = (
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string
) => {
  pdf.setFillColor(color)
  pdf.roundedRect(x, y, width, height, 3, 3, "F")
}

const drawTableHeader = (pdf: jsPDF, x: number, y: number, widths: number[]) => {
  pdf.setFillColor("#F3F4F6")
  pdf.rect(x, y, widths.reduce((sum, width) => sum + width, 0), 24, "F")
  pdf.setDrawColor(BORDER_COLOR)
  pdf.rect(x, y, widths.reduce((sum, width) => sum + width, 0), 24)
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(9)
  pdf.setTextColor(TEXT_COLOR)
  pdf.text("Bulan", x + 10, y + 16)
  pdf.text("Monthly Donations", x + widths[0] + 10, y + 16)
  pdf.text("Monthly Disbursements", x + widths[0] + widths[1] + 10, y + 16)
  pdf.text("Net Balance", x + widths[0] + widths[1] + widths[2] + 10, y + 16)
}

export const exportAnalyticsToPdf = (
  analytics: Analytics | null,
  options: FinancialReportExportOptions = {}
) => {
  const rows = buildFinancialReportRows(analytics, options)
  const totals = getTotals(rows)
  const periodLabel = getPeriodLabel(rows, options)
  const fileName = normalizeFileName(options.fileName ?? "financial-overview-report")
  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 40
  const chartX = margin
  const chartY = 142
  const chartWidth = pageWidth - margin * 2
  const chartHeight = 170

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(20)
  pdf.setTextColor(TEXT_COLOR)
  pdf.text("Financial Overview Report", margin, 42)

  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(10)
  pdf.setTextColor(MUTED_TEXT_COLOR)
  pdf.text(`Periode: ${periodLabel}`, margin, 62)
  pdf.text(
    `Dibuat pada: ${new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" }).format(new Date())}`,
    margin,
    78
  )

  const legendY = 98
  const legendItems = [
    ["Monthly Donations", DONATION_COLOR, formatRupiah(totals.donations)],
    ["Monthly Disbursements", DISBURSEMENT_COLOR, formatRupiah(totals.disbursement)],
    ["Net Balance", "#111827", formatRupiah(totals.balance)],
  ] as const

  legendItems.forEach(([label, color, value], index) => {
    const x = margin + index * 245
    drawRoundedRect(pdf, x, legendY, 10, 10, color)
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(9)
    pdf.setTextColor(TEXT_COLOR)
    pdf.text(label, x + 16, legendY + 8)
    pdf.setFont("helvetica", "normal")
    pdf.setTextColor(MUTED_TEXT_COLOR)
    pdf.text(value, x + 16, legendY + 22)
  })

  if (rows.length === 0) {
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(12)
    pdf.setTextColor(MUTED_TEXT_COLOR)
    pdf.text("Tidak ada data pada periode yang dipilih.", margin, chartY + 40)
    pdf.save(`${fileName}.pdf`)
    return
  }

  const maxValue = Math.max(...rows.flatMap((row) => [row.donations, row.disbursement]), 1)
  const tickCount = 4
  const tickStep = Math.ceil(maxValue / tickCount)
  const axisLabelWidth = 78
  const plotX = chartX + axisLabelWidth
  const plotY = chartY
  const plotWidth = chartWidth - axisLabelWidth
  const plotHeight = chartHeight
  const groupWidth = plotWidth / rows.length
  const barWidth = Math.min(22, Math.max(5, groupWidth * 0.24))

  pdf.setDrawColor(BORDER_COLOR)
  pdf.setLineWidth(0.6)
  pdf.line(plotX, plotY + plotHeight, plotX + plotWidth, plotY + plotHeight)
  pdf.line(plotX, plotY, plotX, plotY + plotHeight)

  for (let index = 0; index <= tickCount; index += 1) {
    const tickValue = tickStep * index
    const y = plotY + plotHeight - (tickValue / (tickStep * tickCount)) * plotHeight

    pdf.setDrawColor("#EEF2F7")
    pdf.line(plotX, y, plotX + plotWidth, y)
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(8)
    pdf.setTextColor(MUTED_TEXT_COLOR)
    pdf.text(formatCompactRupiah(tickValue), chartX, y + 3)
  }

  rows.forEach((row, index) => {
    const centerX = plotX + groupWidth * index + groupWidth / 2
    const donationHeight = (row.donations / (tickStep * tickCount)) * plotHeight
    const disbursementHeight = (row.disbursement / (tickStep * tickCount)) * plotHeight
    const donationX = centerX - barWidth - 2
    const disbursementX = centerX + 2
    const donationY = plotY + plotHeight - donationHeight
    const disbursementY = plotY + plotHeight - disbursementHeight

    pdf.setFillColor(DONATION_COLOR)
    pdf.rect(donationX, donationY, barWidth, donationHeight, "F")
    pdf.setFillColor(DISBURSEMENT_COLOR)
    pdf.rect(disbursementX, disbursementY, barWidth, disbursementHeight, "F")

    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(rows.length > 8 ? 6 : 7)
    pdf.setTextColor(TEXT_COLOR)
    pdf.text(formatCompactRupiah(row.donations), donationX + barWidth / 2, Math.max(plotY + 8, donationY - 4), {
      align: "center",
    })
    pdf.text(formatCompactRupiah(row.disbursement), disbursementX + barWidth / 2, Math.max(plotY + 8, disbursementY - 4), {
      align: "center",
    })

    pdf.setFontSize(8)
    pdf.setTextColor(MUTED_TEXT_COLOR)
    pdf.text(row.label, centerX, plotY + plotHeight + 18, { align: "center" })
  })

  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(12)
  pdf.setTextColor(TEXT_COLOR)
  pdf.text("Detail Nilai Grafik", margin, 370)

  const tableX = margin
  const tableWidths = [160, 190, 190, 190]
  const rowHeight = 24
  let tableY = 384

  drawTableHeader(pdf, tableX, tableY, tableWidths)
  tableY += rowHeight

  rows.forEach((row) => {
    if (tableY + rowHeight > pageHeight - margin) {
      pdf.addPage()
      tableY = margin
      drawTableHeader(pdf, tableX, tableY, tableWidths)
      tableY += rowHeight
    }

    pdf.setDrawColor(BORDER_COLOR)
    pdf.rect(tableX, tableY, tableWidths.reduce((sum, width) => sum + width, 0), rowHeight)
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(9)
    pdf.setTextColor(TEXT_COLOR)
    pdf.text(row.label, tableX + 10, tableY + 16)
    pdf.text(formatRupiah(row.donations), tableX + tableWidths[0] + 10, tableY + 16)
    pdf.text(formatRupiah(row.disbursement), tableX + tableWidths[0] + tableWidths[1] + 10, tableY + 16)
    pdf.text(formatRupiah(row.balance), tableX + tableWidths[0] + tableWidths[1] + tableWidths[2] + 10, tableY + 16)

    tableY += rowHeight
  })

  pdf.save(`${fileName}.pdf`)
}

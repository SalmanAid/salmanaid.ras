import * as XLSX from 'xlsx';

export const exportAnalyticsToExcel = (analytics: any, fileName: string = "Analytics_Report") => {
  if (!analytics) return;

  // 1. Identify all unique months across all available arrays
  const allMonths = new Set<string>();
  Object.values(analytics).forEach((arr: any) => {
    if (Array.isArray(arr)) {
      arr.forEach(item => { if (item.month) allMonths.add(item.month); });
    }
  });

  // 2. Create the Merged Data (The Aggregate)
  const mergedData = Array.from(allMonths).map(month => {
    const row: any = { Month: month };
    
    // Dynamically check every field in the analytics object
    Object.keys(analytics).forEach(key => {
      const dataArray = analytics[key];
      if (Array.isArray(dataArray)) {
        const match = dataArray.find(item => item.month === month);
        // Map keys to readable headers (e.g., monthlyDonations -> Donations)
        const headerName = key.replace('monthly', ''); 
        row[headerName] = match ? Number(match.total) : 0;
      }
    });
    
    return row;
  });

  // 3. Generate the Excel File
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Combined View
  const wsCombined = XLSX.utils.json_to_sheet(mergedData);
  XLSX.utils.book_append_sheet(workbook, wsCombined, "Combined Analytics");

  // Optional: Individual Raw Sheets
  Object.keys(analytics).forEach(key => {
    if (Array.isArray(analytics[key])) {
      const wsRaw = XLSX.utils.json_to_sheet(analytics[key]);
      XLSX.utils.book_append_sheet(workbook, wsRaw, key.replace('monthly', ''));
    }
  });

  // 4. Set Column Widths for a professional look
  wsCombined['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 20 }];

  // 5. Download
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};
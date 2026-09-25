import * as XLSX from 'xlsx';

export function exportToExcel(data: any[], filename: string, sheetName: string = 'Sheet1') {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportToCSV(data: any[], filename: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToJSON(data: any, filename: string) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Parses an Excel or CSV file from an ArrayBuffer/binary string
 */
export async function parseFileToJSON(file: File): Promise<{ headers: string[]; rows: Record<string, any>[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Get json with headers
        const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        // Extract headers from worksheet range or keys
        const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
        resolve({ headers, rows });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
}

/**
 * Generates downloadable Excel templates
 */
export function downloadTemplate(type: 'customer' | 'supplier' | 'product' | 'opening_stock' | 'customers' | 'products' | 'suppliers') {
  let headers: any[] = [];
  let filename = '';

  const normalized = type.replace(/s$/, '');

  switch (normalized) {
    case 'customer':
      filename = 'Customer_Import_Template';
      headers = [
        {
          'Customer Name': 'Meghna Composite Ltd',
          'Company Name': 'Meghna Group',
          'Customer Type': 'Corporate',
          'Contact Person': 'Engr. Tanvir Ahmed',
          'Phone': '+880 1711-238491',
          'Email': 'tanvir@meghna.biz',
          'Billing Address': 'Sonargaon, Narayanganj',
          'City': 'Narayanganj',
          'District': 'Narayanganj',
          'Country': 'Bangladesh',
          'BIN': '001928491-0203',
          'TIN': '391029482910',
          'Opening Balance': 45000,
          'Credit Limit': 1500000,
          'Payment Terms': '30 Days Credit'
        }
      ];
      break;

    case 'supplier':
      filename = 'Supplier_Import_Template';
      headers = [
        {
          'Supplier Name': 'Guangzhou Precision Machinery',
          'Company Name': 'GZ Precision Industry',
          'Contact Person': 'Lily Zhang',
          'Phone': '+86 20 8739 1829',
          'Email': 'export@gzprecision.cn',
          'Address': 'Baiyun District, Guangzhou',
          'City': 'Guangzhou',
          'Country': 'China',
          'Tax ID': 'CN91440101MA5928X',
          'Bank Name': 'Bank of China',
          'Bank Account': '6227 0038 1928 3918',
          'SWIFT Code': 'BKCHCNBJ400',
          'Currency': 'USD',
          'Opening Balance': 0,
          'Payment Terms': 'LC at Sight'
        }
      ];
      break;

    case 'product':
      filename = 'Product_Import_Template';
      headers = [
        {
          'SKU': 'MOT-75KW-3P',
          'Product Name': 'Heavy Duty 3-Phase Electric Motor 7.5KW',
          'Category': 'Machinery & Spare Parts',
          'Brand': 'Siemens / Techtop',
          'HS Code': '8501.52.00',
          'Country of Origin': 'Germany',
          'Unit': 'Set',
          'Purchase Price': 48000,
          'Selling Price': 62500,
          'Wholesale Price': 58000,
          'Opening Stock': 40,
          'Minimum Stock': 10,
          'Tax Rate': 2,
          'VAT Rate': 5,
          'Weight': 68.5
        }
      ];
      break;

    case 'opening_stock':
      filename = 'Opening_Stock_Import_Template';
      headers = [
        {
          'SKU': 'MOT-75KW-3P',
          'Product Name': 'Heavy Duty 3-Phase Electric Motor 7.5KW',
          'Opening Stock Quantity': 50,
          'Unit Cost': 48000,
          'Location': 'Mirpur Central Depot',
          'Date': '2026-01-01'
        }
      ];
      break;
  }

  exportToExcel(headers, filename, 'Template');
}

export async function readExcelFile(file: File): Promise<any[]> {
  const res = await parseFileToJSON(file);
  return res.rows;
}

export function validateCustomerImport(row: any): { valid: boolean; error?: string } {
  if (!row['Customer Name'] && !row['customerName']) {
    return { valid: false, error: 'Customer Name is missing' };
  }
  return { valid: true };
}

export function validateProductImport(row: any): { valid: boolean; error?: string } {
  if (!row['Product Name'] && !row['productName']) {
    return { valid: false, error: 'Product Name is missing' };
  }
  return { valid: true };
}

/**
 * Currency and Number formatters for Bismillah Multitrade ERP
 */

export type DatePeriod = 'Today' | 'This Week' | 'This Month' | 'Last Month' | 'This Quarter' | 'This Year' | 'All Time';

export function formatCurrency(
  amount: number,
  currency: string = 'BDT',
  locale: string = 'en-BD'
): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    amount = 0;
  }

  // Always use Bangladeshi Taka symbol ৳
  const symbol = '৳ ';
  
  // Format with commas and 2 decimals
  const parts = Math.abs(amount).toFixed(2).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  // Bangladeshi comma grouping: 3 digits from right, then groups of 2 digits
  // e.g. 10000000 -> 1,00,00,000
  if (integerPart.length > 3) {
    const lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    const formattedOther = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    integerPart = formattedOther + ',' + lastThree;
  } else {
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  const sign = amount < 0 ? '-' : '';
  return `${sign}${symbol}${integerPart}.${decimalPart}`;
}

export function formatNumber(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0.00';
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converts a number to words in English using the Bangladeshi numbering system (Crore, Lac, Thousand, Hundred, Taka, Paisa).
 * Example: 100000 -> "One Lac Taka Only."
 * Example: 110750 -> "One Lac Ten Thousand Seven Hundred Fifty Taka Only."
 */
export function numberToWordsBDT(num: number): string {
  if (num === 0) return 'Zero Taka Only.';
  if (!num || isNaN(num)) return '';

  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertNumber(n: number): string {
    let str = '';
    // 1 Crore = 10,000,000 (100 Lac)
    if (n >= 10000000) {
      str += convertNumber(Math.floor(n / 10000000)) + 'Crore ';
      n %= 10000000;
    }
    // 1 Lac = 100,000
    if (n >= 100000) {
      str += convertNumber(Math.floor(n / 100000)) + 'Lac ';
      n %= 100000;
    }
    // 1 Thousand = 1,000
    if (n >= 1000) {
      str += convertNumber(Math.floor(n / 1000)) + 'Thousand ';
      n %= 1000;
    }
    // 1 Hundred = 100
    if (n >= 100) {
      str += a[Math.floor(n / 100)] + 'Hundred ';
      n %= 100;
    }
    if (n > 0) {
      if (n < 20) {
        str += a[n];
      } else {
        const ten = Math.floor(n / 10);
        const unit = n % 10;
        str += b[ten] + (unit !== 0 ? ' ' + a[unit] : ' ');
      }
    }
    return str;
  }

  const rounded = Math.round(num * 100) / 100;
  const wholePart = Math.floor(rounded);
  const decimalPart = Math.round((rounded - wholePart) * 100);

  let result = convertNumber(wholePart).trim();
  result = result.charAt(0).toUpperCase() + result.slice(1);
  result += ' Taka';

  if (decimalPart > 0) {
    const paisaWords = convertNumber(decimalPart).trim();
    result += ` and ${paisaWords} Paisa`;
  }

  return result + ' Only.';
}

export function getDateRangePreset(preset: string): { start?: string; end?: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  if (preset === 'this_month') {
    const start = new Date(y, m, 1).toISOString().slice(0, 10);
    const end = new Date(y, m + 1, 0).toISOString().slice(0, 10);
    return { start, end };
  }
  if (preset === 'last_month') {
    const start = new Date(y, m - 1, 1).toISOString().slice(0, 10);
    const end = new Date(y, m, 0).toISOString().slice(0, 10);
    return { start, end };
  }
  if (preset === 'this_year') {
    const start = `${y}-01-01`;
    const end = `${y}-12-31`;
    return { start, end };
  }
  return {};
}

/**
 * Parses date safely without UTC offset shifts
 */
export function parseDateSafe(dateInput: string | Date | undefined): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? null : dateInput;
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      return new Date(year, month, day, 12, 0, 0);
    }
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Checks if a given date string or object falls inside the requested period
 */
export function isDateInPeriod(
  dateInput: string | Date | undefined,
  period: DatePeriod | string,
  referenceDate: Date = new Date()
): boolean {
  if (!dateInput) return false;
  if (period === 'All Time') return true;

  const d = parseDateSafe(dateInput);
  if (!d) return false;

  const now = referenceDate;
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth();
  const nowDate = now.getDate();

  const dYear = d.getFullYear();
  const dMonth = d.getMonth();
  const dDate = d.getDate();

  switch (period) {
    case 'Today': {
      return dYear === nowYear && dMonth === nowMonth && dDate === nowDate;
    }
    case 'This Week': {
      // Week from Monday to Sunday
      const dayOfWeek = now.getDay(); // 0 is Sun, 1 is Mon...
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const startOfWeek = new Date(nowYear, nowMonth, nowDate - diffToMonday, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);

      const targetMidday = new Date(dYear, dMonth, dDate, 12, 0, 0).getTime();
      return targetMidday >= startOfWeek.getTime() && targetMidday < endOfWeek.getTime();
    }
    case 'This Month': {
      return dYear === nowYear && dMonth === nowMonth;
    }
    case 'Last Month': {
      const lastMonthYear = nowMonth === 0 ? nowYear - 1 : nowYear;
      const lastMonth = nowMonth === 0 ? 11 : nowMonth - 1;
      return dYear === lastMonthYear && dMonth === lastMonth;
    }
    case 'This Quarter': {
      const nowQuarter = Math.floor(nowMonth / 3);
      const dQuarter = Math.floor(dMonth / 3);
      return dYear === nowYear && dQuarter === nowQuarter;
    }
    case 'This Year': {
      return dYear === nowYear;
    }
    default:
      return true;
  }
}

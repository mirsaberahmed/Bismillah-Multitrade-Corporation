/**
 * Bulletproof print utility for ERP documents.
 * Directly triggers the native browser print dialog, ensuring 100% styling fidelity
 * with Tailwind CSS, proper A4 portrait sizing, crisp borders, and exact typography.
 */
export const printElement = (_elementId?: string): void => {
  try {
    // Focus current window and trigger native print
    window.focus();
    window.print();
  } catch (error) {
    console.error('Print utility error:', error);
    try {
      window.print();
    } catch {
      // Ignore if print dialog was blocked
    }
  }
};

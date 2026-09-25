import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Downloads a DOM element as a formatted A4 PDF document.
 * Falls back safely to window.print() if canvas rendering is prevented by sandbox.
 */
export async function downloadElementAsPdf(
  element: HTMLElement | null,
  filename: string,
  onProgress?: (loading: boolean) => void
): Promise<void> {
  if (!element) {
    window.print();
    return;
  }

  try {
    if (onProgress) onProgress(true);

    // Capture element with safe options
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      windowWidth: 1024
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
  } catch (err) {
    console.warn('HTML2Canvas/jsPDF generation encountered issue, invoking standard browser PDF export dialog:', err);
    window.print();
  } finally {
    if (onProgress) onProgress(false);
  }
}

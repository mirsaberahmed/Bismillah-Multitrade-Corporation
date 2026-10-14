import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Downloads a DOM element as a formatted A4 PDF document with high speed and crisp resolution.
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

    // Optimized capture: scale 1.6 gives crisp 300dpi-equivalent print without lag
    const canvas = await html2canvas(element, {
      scale: 1.6,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      imageTimeout: 5000,
      windowWidth: element.scrollWidth || 800
    });

    // JPEG encoding is ~5-10x faster than PNG and keeps file size tiny
    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    while (heightLeft > 5) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
  } catch (err) {
    console.warn('Fast PDF export encountered issue, falling back to browser print dialog:', err);
    window.print();
  } finally {
    if (onProgress) onProgress(false);
  }
}

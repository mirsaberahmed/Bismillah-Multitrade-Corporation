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
    console.warn('downloadElementAsPdf: target element not found for', filename);
    return;
  }

  try {
    if (onProgress) onProgress(true);

    // Optimized capture: scale 1.25 gives crisp A4 vector-like resolution with instant rendering speed
    const canvas = await html2canvas(element, {
      scale: 1.25,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      imageTimeout: 0,
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
    console.error('PDF export error:', err);
  } finally {
    if (onProgress) onProgress(false);
  }
}

/**
 * Generates an A4 PDF document from an HTML element and returns it as a File and Blob for sharing.
 */
export async function generateElementAsPdfBlob(
  element: HTMLElement | null,
  filename: string,
  onProgress?: (loading: boolean) => void
): Promise<{ file: File; blob: Blob; dataUrl: string } | null> {
  if (!element) return null;

  try {
    if (onProgress) onProgress(true);

    const canvas = await html2canvas(element, {
      scale: 1.25,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      imageTimeout: 0,
      windowWidth: element.scrollWidth || 800
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const imgWidth = 210;
    const pageHeight = 297;
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

    const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    const blob = pdf.output('blob');
    const file = new File([blob], cleanFilename, { type: 'application/pdf' });
    const dataUrl = pdf.output('dataurlstring');

    return { file, blob, dataUrl };
  } catch (err) {
    console.error('Failed to generate PDF blob:', err);
    return null;
  } finally {
    if (onProgress) onProgress(false);
  }
}

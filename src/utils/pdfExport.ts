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
 * If the element is not found or fails, it retrieves the authentic, already-created PDF from the server.
 */
export async function generateElementAsPdfBlob(
  element: HTMLElement | null,
  filename: string,
  onProgress?: (loading: boolean) => void,
  fallbackText?: string
): Promise<{ file: File; blob: Blob; dataUrl: string } | null> {
  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

  // Fetch already-created official PDF from the server
  const fetchExistingServerPdf = async (): Promise<{ file: File; blob: Blob; dataUrl: string } | null> => {
    try {
      const res = await fetch(`/api/pdf/${cleanFilename}`);
      if (res.ok) {
        const blob = await res.blob();
        if (blob && blob.size > 1000) {
          const file = new File([blob], cleanFilename, { type: 'application/pdf' });
          const dataUrl = URL.createObjectURL(blob);
          return { file, blob, dataUrl };
        }
      }
    } catch (e) {
      console.warn('Could not fetch existing server PDF:', e);
    }
    return null;
  };

  try {
    if (onProgress) onProgress(true);

    if (element) {
      // If element is fixed/hidden offscreen, ensure html2canvas can measure it
      const originalPosition = element.style.position;
      const originalVisibility = element.style.visibility;
      const originalDisplay = element.style.display;

      if (element.style.display === 'none') {
        element.style.display = 'block';
        element.style.visibility = 'hidden';
      }

      try {
        const canvas = await html2canvas(element, {
          scale: 1.25,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff',
          scrollX: 0,
          scrollY: 0,
          imageTimeout: 2000,
          windowWidth: element.scrollWidth || 800,
          onclone: (_clonedDoc, clonedEl) => {
            clonedEl.style.position = 'static';
            clonedEl.style.visibility = 'visible';
            clonedEl.style.display = 'block';
            clonedEl.style.opacity = '1';
          }
        });

        // Revert style overrides
        element.style.position = originalPosition;
        element.style.visibility = originalVisibility;
        element.style.display = originalDisplay;

        if (canvas.width > 0 && canvas.height > 0) {
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

          const blob = pdf.output('blob');
          const file = new File([blob], cleanFilename, { type: 'application/pdf' });
          const dataUrl = pdf.output('dataurlstring');
          return { file, blob, dataUrl };
        }
      } catch (canvasErr) {
        console.warn('html2canvas capture skipped, using authentic server PDF:', canvasErr);
      }
    }

    // Always fallback to retrieving the authentic already-created server PDF
    return await fetchExistingServerPdf();
  } catch (err) {
    console.error('Failed to generate PDF blob:', err);
    return await fetchExistingServerPdf();
  } finally {
    if (onProgress) onProgress(false);
  }
}

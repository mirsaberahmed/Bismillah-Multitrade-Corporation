/**
 * Bulletproof print utility for AI Studio and standard browsers.
 * Uses an isolated hidden iframe with exact A4 page settings so that
 * the print preview dialog opens reliably and fits perfectly on a single A4 page.
 */
export const printElement = (elementId: string): void => {
  try {
    const el = document.getElementById(elementId);
    if (!el) {
      window.focus();
      window.print();
      return;
    }

    // Try isolated hidden iframe printing first (best for A4 fit & reliability)
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc || !iframe.contentWindow) {
      document.body.removeChild(iframe);
      window.focus();
      window.print();
      return;
    }

    // Grab all active Tailwind and custom CSS rules
    const styleTags = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(node => node.outerHTML)
      .join('\n');

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Print Document</title>
          ${styleTags}
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 12mm 10mm 12mm;
            }
            *, *::before, *::after {
              box-sizing: border-box !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background-color: #ffffff !important;
              background: #ffffff !important;
              color: #000000 !important;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
              width: 100% !important;
              height: auto !important;
              overflow: visible !important;
            }
            .printable-sheet {
              width: 100% !important;
              max-width: 186mm !important;
              margin: 0 auto !important;
              padding: 0 !important;
              box-shadow: none !important;
              border: none !important;
            }
          </style>
        </head>
        <body class="bg-white text-black p-0 m-0">
          <div class="printable-sheet">
            ${el.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    // Allow CSS resources to parse then trigger print
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.warn('Iframe print error, falling back to window.print():', err);
        window.focus();
        window.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }
    }, 250);
  } catch (error) {
    console.error('Print utility error:', error);
    window.focus();
    window.print();
  }
};

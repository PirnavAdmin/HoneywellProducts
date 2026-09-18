import { jsPDF } from 'jspdf';

/**
 * Generates an official Honeywell product PDF document (Datasheet, Manual, Brochure, Certificate).
 * Can either trigger a direct .pdf file download or open a PDF preview in a new browser tab.
 * 
 * @param {Object} product - Product data object
 * @param {string} docType - 'datasheet' | 'manual' | 'brochure' | 'certification' | 'documents'
 * @param {string} mode - 'download' | 'view'
 */
export function generateProductPdf(product, docType = 'datasheet', mode = 'download') {
  if (!product) return;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const productName = product.name || product.title || product.productName || 'Honeywell Enterprise Product';
  const category = product.category || 'Surveillance & Security';
  const model = product.model || product.sku || ('HN-PRD-' + (product.id || '001'));
  
  let typeLabel = 'Technical Datasheet & Specifications';
  if (docType === 'manual') typeLabel = 'Installation & User Manual';
  else if (docType === 'brochure') typeLabel = 'Official Product Brochure';
  else if (docType === 'certification' || docType === 'documents') typeLabel = 'Certificate of Quality & Compliance';

  // 1. Top Header Accent Bar (Honeywell Red & Dark Blue)
  pdf.setFillColor(227, 6, 19); // Honeywell Red
  pdf.rect(0, 0, pageWidth, 4, 'F');

  pdf.setFillColor(15, 23, 42); // Dark Slate Blue Header
  pdf.rect(0, 4, pageWidth, 28, 'F');

  // Brand Name & Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(255, 255, 255);
  pdf.text('HONEYWELL', margin, 17);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.setTextColor(203, 213, 225);
  pdf.text('Official Technical Documentation & Product Specification Sheet', margin, 23);

  // Document Type Tag (Top Right Box)
  pdf.setFillColor(2, 132, 199); // Sky Blue Badge
  pdf.roundedRect(pageWidth - margin - 60, 10, 60, 13, 2, 2, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(255, 255, 255);
  pdf.text(typeLabel.toUpperCase(), pageWidth - margin - 30, 17.5, { align: 'center' });

  y = 40;

  // 2. Product Title Box
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(15);
  pdf.setTextColor(15, 23, 42);
  const nameLines = pdf.splitTextToSize(productName, contentWidth);
  nameLines.forEach((line) => {
    pdf.text(line, margin, y);
    y += 6;
  });

  // Category & Model Meta Box
  y += 2;
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(71, 85, 105);
  pdf.text('Category: ', margin + 6, y + 9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(15, 23, 42);
  pdf.text(String(category), margin + 23, y + 9);

  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(71, 85, 105);
  pdf.text('Model / SKU: ', margin + 95, y + 9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(15, 23, 42);
  pdf.text(String(model), margin + 117, y + 9);

  y += 20;

  // 3. Product Description Section
  const description = product.description || product.productDetails || product.shortDescription || 'High-performance commercial product built for enterprise reliability, seamless integration, and industry compliance.';
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(15, 23, 42);
  pdf.text('1. Product Overview', margin, y);
  y += 6;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.setTextColor(51, 65, 85);
  const descLines = pdf.splitTextToSize(description, contentWidth);
  descLines.forEach((line) => {
    if (y + 5 > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
    pdf.text(line, margin, y);
    y += 5;
  });

  y += 5;

  // 4. Key Highlights & Features
  const rawHighlights = product.highlights || product.features || [];
  const highlights = Array.isArray(rawHighlights)
    ? rawHighlights.map((h) => typeof h === 'object' ? (h.name || h.feature || String(h)) : String(h)).filter(Boolean)
    : [];

  if (highlights.length > 0) {
    if (y + 20 > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(15, 23, 42);
    pdf.text('2. Key Features & Capabilities', margin, y);
    y += 6;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(51, 65, 85);

    highlights.forEach((item) => {
      if (y + 6 > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
      pdf.setFillColor(2, 132, 199);
      pdf.circle(margin + 2.5, y - 1.5, 1, 'F');
      const itemLines = pdf.splitTextToSize(item, contentWidth - 8);
      itemLines.forEach((l, idx) => {
        pdf.text(l, margin + 7, y + (idx * 4.5));
      });
      y += (itemLines.length * 4.5) + 2;
    });

    y += 4;
  }

  // 5. Technical Specifications Table
  const rawSpecs = product.specifications || product.specificationsObj || [];
  let specArray = [];
  if (Array.isArray(rawSpecs)) {
    specArray = rawSpecs;
  } else if (typeof rawSpecs === 'object' && rawSpecs !== null) {
    specArray = Object.entries(rawSpecs).map(([k, v]) => `${k}: ${v}`);
  }

  if (specArray.length > 0) {
    if (y + 25 > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(15, 23, 42);
    pdf.text('3. Technical Specifications', margin, y);
    y += 6;

    // Table Header
    pdf.setFillColor(241, 245, 249);
    pdf.setDrawColor(203, 213, 225);
    pdf.rect(margin, y, contentWidth, 7, 'FD');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(30, 41, 59);
    pdf.text('SPECIFICATION PARAMETER', margin + 4, y + 4.8);
    pdf.text('VALUE / DETAILS', margin + 80, y + 4.8);
    y += 7;

    specArray.forEach((item, idx) => {
      let key = '';
      let val = '';
      if (typeof item === 'string') {
        const colonIdx = item.indexOf(':');
        if (colonIdx > 0) {
          key = item.slice(0, colonIdx).trim();
          val = item.slice(colonIdx + 1).trim();
        } else {
          key = 'Specification';
          val = item.trim();
        }
      } else if (typeof item === 'object' && item !== null) {
        key = item.label || item.key || 'Specification';
        val = String(item.value || '');
      }

      if (y + 8 > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }

      // Alternating Row Color
      if (idx % 2 === 1) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(margin, y, contentWidth, 7, 'F');
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(51, 65, 85);
      pdf.text(key, margin + 4, y + 4.8);

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(15, 23, 42);
      const valLines = pdf.splitTextToSize(val || 'N/A', contentWidth - 84);
      pdf.text(valLines[0] || 'N/A', margin + 80, y + 4.8);
      y += 7;
    });

    y += 4;
  }

  // 6. Quality & Compliance Notice Box
  if (y + 26 > pageHeight - margin) {
    pdf.addPage();
    y = margin;
  }

  y += 2;
  pdf.setFillColor(240, 253, 250);
  pdf.setDrawColor(204, 251, 241);
  pdf.roundedRect(margin, y, contentWidth, 22, 2, 2, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(15, 118, 110);
  pdf.text('OFFICIAL CERTIFICATION & QUALITY ASSURANCE', margin + 6, y + 6);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(19, 78, 74);
  pdf.text('This product is manufactured under strict Honeywell quality management protocols, conforming to ISO 9001, CE, FCC,', margin + 6, y + 11);
  pdf.text('and RoHS environmental standards. Document verified for official procurement and technical submission.', margin + 6, y + 15);

  // 7. Footer Page Numbers & Date Stamp
  const totalPages = pdf.internal.getNumberOfPages();
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setDrawColor(226, 232, 240);
    pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`Honeywell Document Ref: DOC-${product.id || '101'}-${i}`, margin, pageHeight - 6);
    pdf.text(`Issued: ${dateStr}`, pageWidth / 2, pageHeight - 6, { align: 'center' });
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  // File Name Sanitization
  const cleanName = (productName + '-' + docType).replace(/[^a-zA-Z0-9\-_]/g, '_') + '.pdf';

  if (mode === 'view') {
    const blobUrl = pdf.output('bloburl');
    window.open(blobUrl, '_blank');
  } else {
    pdf.save(cleanName);
  }
}

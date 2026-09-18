import { useEffect } from 'react';
import { Download, Printer, X, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function PartnerTermsModal({ isOpen, onClose, partnerData }) {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !partnerData) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 16;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // Company Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(18, 104, 165);
    doc.text('Honeywell Products', margin, y);
    y += 7;

    // Document Title
    doc.setFontSize(13);
    doc.setTextColor(16, 39, 53);
    doc.text(partnerData.title, margin, y);
    y += 6;

    // Date
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(100, 100, 100);
    doc.text(`Last Updated: ${partnerData.lastUpdated}`, margin, y);
    y += 7;

    // Divider
    doc.setDrawColor(210, 215, 220);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    // Sections
    partnerData.sections.forEach((sec) => {
      // Check for page overflow on section title
      if (y + 16 > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(16, 39, 53);
      doc.text(sec.title, margin, y);
      y += 5.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);

      const lines = doc.splitTextToSize(sec.content, contentWidth);
      lines.forEach((line) => {
        if (y + 5 > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += 4.5;
      });

      y += 3.5;
    });

    // Disclaimer Box
    const discLines = doc.splitTextToSize(partnerData.disclaimer, contentWidth - 8);
    const discHeight = 10 + discLines.length * 4;

    if (y + discHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }

    y += 2;
    doc.setDrawColor(210, 215, 220);
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(margin, y, contentWidth, discHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 110, 120);
    doc.text('IMPORTANT NOTICE', margin + 4, y + 5);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(80, 90, 100);

    let discY = y + 9;
    discLines.forEach((line) => {
      doc.text(line, margin + 4, discY);
      discY += 4;
    });

    // Page Numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      doc.text(
        `Page ${i} of ${pageCount}  |  Honeywell Products — ${partnerData.partnerType} Terms & Conditions`,
        pageWidth / 2,
        pageHeight - 7,
        { align: 'center' }
      );
    }

    doc.save(partnerData.pdfFilename);
  };

  return (
    <div
      className="partner-terms-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="partner-terms-title"
    >
      <div
        className="partner-terms-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <header className="partner-terms-modal-header">
          <div className="partner-terms-modal-header-title">
            <span className="partner-terms-modal-icon">
              <FileText size={22} />
            </span>
            <div>
              <h2 id="partner-terms-title">{partnerData.title}</h2>
              <p className="partner-terms-date">Last Updated: {partnerData.lastUpdated}</p>
            </div>
          </div>
          <button
            className="partner-terms-close-btn"
            onClick={onClose}
            aria-label="Close modal"
            type="button"
          >
            <X size={20} />
          </button>
        </header>

        {/* Printable Content Area */}
        <div className="partner-terms-modal-body partner-terms-printable-content">
          <div className="partner-terms-print-header">
            <h1>Honeywell Products</h1>
            <h2>{partnerData.title}</h2>
            <p>Last Updated: {partnerData.lastUpdated}</p>
            <hr />
          </div>

          <div className="partner-terms-sections">
            {partnerData.sections.map((sec) => (
              <article key={sec.id} className="partner-terms-section-item">
                <h3>{sec.title}</h3>
                <p>{sec.content}</p>
              </article>
            ))}
          </div>

          <div className="partner-terms-disclaimer-box">
            <h4>Important Notice</h4>
            <p>{partnerData.disclaimer}</p>
          </div>
        </div>

        {/* Modal Footer */}
        <footer className="partner-terms-modal-footer">
          <div className="partner-terms-footer-actions">
            <button
              className="button outline partner-terms-btn"
              onClick={handlePrint}
              type="button"
            >
              <Printer size={16} /> Print Terms
            </button>
            <button
              className="button partner-terms-btn"
              onClick={handleDownloadPdf}
              type="button"
            >
              <Download size={16} /> Download PDF
            </button>
          </div>
          <button
            className="button outline partner-terms-btn partner-terms-btn-close"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}

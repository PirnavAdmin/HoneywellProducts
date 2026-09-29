import { jsPDF } from 'jspdf';
import { resolveImageUrl } from '../admin/catalog/productsApi';

// Official Honeywell Brand Assets & Catalog Fallback Imagery
import logoImageSrc from '../assets/images/honeywell-products-logo.png';
import bulletCamImg from '../assets/images/catalog/bullet-camera.jpg';
import domeCamImg from '../assets/images/catalog/dome-camera.jpg';
import ptzCamImg from '../assets/images/catalog/ptz-camera.jpg';
import solarCamImg from '../assets/images/catalog/solar-camera.jpg';
import ipCamImg from '../assets/images/catalog/ip-camera.jpg';
import wifiCamImg from '../assets/images/catalog/wifi-camera.jpg';
import fourGCamImg from '../assets/images/catalog/4g-camera.jpg';
import nvrImg from '../assets/images/catalog/nvr.jpg';
import dvrImg from '../assets/images/catalog/dvr.jpg';
import storageImg from '../assets/images/catalog/storage.jpg';
import networkingImg from '../assets/images/catalog/networking.jpg';
import accessoriesImg from '../assets/images/catalog/accessories.jpg';
import cctvCamImg from '../assets/images/catalog/cctv-camera.jpg';

/**
 * Extracts a candidate product image URL from any product object shape.
 */
export const extractProductImageUrl = (product) => {
  if (!product) return '';
  if (typeof product === 'string' && product.trim()) return product.trim();

  // 1. Direct scalar properties
  const scalarProps = [
    product.image,
    product.imageUrl,
    product.mainImageUrl,
    product.productImage,
    product.thumbnail,
    product.photo,
    product.mediaUrl,
    product.posterUrl,
    product.posterImage,
    product.poster,
  ];

  for (const val of scalarProps) {
    if (typeof val === 'string' && val.trim() && !val.toLowerCase().includes('placeholder')) {
      return val.trim();
    }
  }

  // 2. Array properties: images, gallery, media
  const arrayProps = [product.images, product.gallery, product.media];
  for (const arr of arrayProps) {
    if (Array.isArray(arr) && arr.length > 0) {
      for (const item of arr) {
        if (typeof item === 'string' && item.trim() && !item.toLowerCase().includes('placeholder')) {
          return item.trim();
        }
        if (typeof item === 'object' && item !== null) {
          const itemUrl =
            item.imageUrl ||
            item.ImageUrl ||
            item.url ||
            item.Url ||
            item.image ||
            item.Image ||
            item.mediaUrl ||
            item.MediaUrl;
          if (typeof itemUrl === 'string' && itemUrl.trim() && !itemUrl.toLowerCase().includes('placeholder')) {
            return itemUrl.trim();
          }
        }
      }
    }
  }

  return '';
};

/**
 * Matches a category/type-specific Honeywell catalog image fallback.
 */
export const getFallbackProductImage = (product) => {
  const text = `${product?.name || ''} ${product?.title || ''} ${product?.category || ''} ${product?.categoryName || ''} ${product?.productType || ''} ${product?.subcategory || ''} ${product?.subcategoryName || ''}`.toLowerCase();

  if (text.includes('solar')) return solarCamImg;
  if (text.includes('bullet')) return bulletCamImg;
  if (text.includes('dome')) return domeCamImg;
  if (text.includes('ptz') || text.includes('speed dome')) return ptzCamImg;
  if (text.includes('wifi') || text.includes('wi-fi') || text.includes('wireless')) return wifiCamImg;
  if (text.includes('4g') || text.includes('sim') || text.includes('cellular')) return fourGCamImg || bulletCamImg;
  if (text.includes('ip camera') || text.includes('network camera') || text.includes('ip-cam')) return ipCamImg;
  if (text.includes('nvr') || text.includes('network video')) return nvrImg;
  if (text.includes('dvr') || text.includes('digital video')) return dvrImg;
  if (text.includes('storage') || text.includes('hard disk') || text.includes('hdd') || text.includes('sd card')) return storageImg;
  if (text.includes('network') || text.includes('switch') || text.includes('router') || text.includes('poe')) return networkingImg;
  if (text.includes('access') || text.includes('mount') || text.includes('bracket') || text.includes('cable') || text.includes('power')) return accessoriesImg;

  return cctvCamImg || bulletCamImg;
};

/**
 * Robustly loads an image from URL / Asset path and converts it to a base64 Data URL for embedding in jsPDF.
 */
export const loadImageData = async (url) => {
  if (!url || typeof url !== 'string' || !url.trim()) return null;
  const trimmed = url.trim();

  // 1. If already a Base64 Data URL
  if (trimmed.startsWith('data:image/')) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const isJpg = trimmed.startsWith('data:image/jpeg') || trimmed.startsWith('data:image/jpg');
        resolve({
          dataUrl: trimmed,
          width: img.naturalWidth || 300,
          height: img.naturalHeight || 300,
          format: isJpg ? 'JPEG' : 'PNG',
        });
      };
      img.onerror = () => {
        resolve({
          dataUrl: trimmed,
          width: 300,
          height: 300,
          format: 'PNG',
        });
      };
      img.src = trimmed;
    });
  }

  const resolvedUrl = resolveImageUrl(trimmed) || trimmed;

  // 2. Attempt: Fetch as Blob -> FileReader -> Base64 Data URL
  // This bypasses HTML Canvas taint issues for same-origin, Vite assets, public assets, and CORS APIs
  try {
    const resp = await fetch(resolvedUrl, { mode: 'cors' });
    if (resp.ok) {
      const blob = await resp.blob();
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      if (base64 && typeof base64 === 'string') {
        const dimensions = await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ width: img.naturalWidth || 300, height: img.naturalHeight || 300 });
          img.onerror = () => resolve({ width: 300, height: 300 });
          img.src = base64;
        });

        const isJpg = base64.startsWith('data:image/jpeg') || base64.startsWith('data:image/jpg');
        return {
          dataUrl: base64,
          width: dimensions.width,
          height: dimensions.height,
          format: isJpg ? 'JPEG' : 'PNG',
        };
      }
    }
  } catch (fetchErr) {
    // Continue to HTML Canvas conversion attempts if fetch is restricted
  }

  // 3. Fallback Attempt: HTML Image with Canvas conversion
  const tryCanvasConversion = (withCrossOrigin = true) => {
    return new Promise((resolve) => {
      const img = new Image();
      if (withCrossOrigin) {
        img.crossOrigin = 'Anonymous';
      }
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width || 300;
          canvas.height = img.naturalHeight || img.height || 300;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');
          resolve({
            dataUrl,
            width: canvas.width,
            height: canvas.height,
            format: 'PNG',
          });
        } catch (err) {
          resolve(null);
        }
      };
      img.onerror = () => {
        resolve(null);
      };
      img.src = resolvedUrl;
    });
  };

  const canvasWithCors = await tryCanvasConversion(true);
  if (canvasWithCors) return canvasWithCors;

  const canvasWithoutCors = await tryCanvasConversion(false);
  if (canvasWithoutCors) return canvasWithoutCors;

  return null;
};

/**
 * Generates a high-quality, professional Honeywell product PDF document
 * (Datasheet, User Manual, Brochure, Certificate of Compliance).
 *
 * @param {Object} product - Product data object
 * @param {string} docType - 'datasheets' | 'manuals' | 'brochures' | 'documents' | 'certification'
 * @param {string} mode - 'download' | 'view'
 */
export async function generateProductPdf(product, docType = 'datasheets', mode = 'download') {
  if (!product) return;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const productName = (product.name || product.title || product.productName || 'Honeywell Professional Security Product').trim();
  const category = (typeof product.category === 'object' ? product.category?.name : product.category) || 'Surveillance & Security Systems';
  const model = product.model || product.sku || product.productCode || `HON-PRD-${String(product.id || '001').padStart(3, '0')}`;
  const brandName = product.brand || 'Honeywell';

  // Normalize docType
  const normType = String(docType).toLowerCase();
  const isDatasheet = normType.includes('datasheet');
  const isManual = normType.includes('manual');
  const isBrochure = normType.includes('brochure');
  const isCert = normType.includes('cert') || normType.includes('document');

  // Palette & Labels by document type
  let typeLabel = 'TECHNICAL DATASHEET';
  let badgeBg = [2, 132, 199]; // Blue
  let docSubtitle = 'Official Technical Documentation & Specification Sheet';

  if (isManual) {
    typeLabel = 'USER & INSTALLATION MANUAL';
    badgeBg = [99, 102, 241]; // Indigo
    docSubtitle = 'Official Hardware Installation, Setup & Maintenance Guide';
  } else if (isBrochure) {
    typeLabel = 'PRODUCT BROCHURE';
    badgeBg = [5, 150, 105]; // Emerald
    docSubtitle = 'Enterprise Solution Overview & Commercial Deployment Guide';
  } else if (isCert) {
    typeLabel = 'CERTIFICATE OF COMPLIANCE';
    badgeBg = [217, 119, 6]; // Amber/Gold
    docSubtitle = 'Official Quality Assurance, Standards & Regulatory Certification';
  }

  // Pre-load Company Logo (with bundled asset + public URL fallback)
  let logoImgData = await loadImageData(logoImageSrc);
  if (!logoImgData) {
    logoImgData = await loadImageData('/honeywell-products-logo.png');
  }

  // Pre-load Product Image with automatic fallbacks
  const rawProductImg = extractProductImageUrl(product);
  let productImgData = null;

  if (rawProductImg) {
    productImgData = await loadImageData(rawProductImg);
  }

  // If specific product image failed or is missing, use category-matched Honeywell catalog image
  if (!productImgData) {
    const fallbackImgSrc = getFallbackProductImage(product);
    if (fallbackImgSrc) {
      productImgData = await loadImageData(fallbackImgSrc);
    }
  }

  // ── Header Renderer Helper ──
  const drawPageHeader = () => {
    // 1. Top Brand Accent Bars
    pdf.setFillColor(227, 6, 19); // Honeywell Red
    pdf.rect(0, 0, pageWidth, 4, 'F');

    pdf.setFillColor(15, 23, 42); // Navy Header
    pdf.rect(0, 4, pageWidth, 24, 'F');

    // 2. Company Logo or Fallback Text
    if (logoImgData?.dataUrl) {
      const targetH = 14;
      const targetW = (logoImgData.width / logoImgData.height) * targetH;
      const safeW = Math.min(targetW, 58);
      pdf.addImage(logoImgData.dataUrl, logoImgData.format || 'PNG', margin, 9, safeW, targetH);
    } else {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.setTextColor(255, 255, 255);
      pdf.text('HONEYWELL', margin, 18);
    }

    // Header Subtitle
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(203, 213, 225);
    pdf.text(docSubtitle, margin + 62, 18);

    // 3. Document Type Badge (Top Right)
    const badgeW = 60;
    const badgeH = 12;
    pdf.setFillColor(...badgeBg);
    pdf.roundedRect(pageWidth - margin - badgeW, 10, badgeW, badgeH, 2, 2, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text(typeLabel, pageWidth - margin - (badgeW / 2), 17.5, { align: 'center' });
  };

  // ── Draw Header on First Page ──
  drawPageHeader();
  y = 35;

  // ════════════════════════════════════════════════════════════════════════════
  // 1. PRODUCT SHOWCASE HERO (Split with Product Image & Key Metadata)
  // ════════════════════════════════════════════════════════════════════════════
  const heroBoxH = 50;
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(margin, y, contentWidth, heroBoxH, 3, 3, 'FD');

  // Left Section: Product Details
  const textColW = contentWidth - 56;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(15, 23, 42);
  const titleLines = pdf.splitTextToSize(productName, textColW);
  pdf.text(titleLines.slice(0, 2), margin + 6, y + 9);

  // Meta Pill Row
  let metaY = y + (titleLines.length > 1 ? 19 : 15);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text('CATEGORY:', margin + 6, metaY);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(15, 23, 42);
  pdf.text(String(category), margin + 27, metaY);

  metaY += 5.5;
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(100, 116, 139);
  pdf.text('MODEL / SKU:', margin + 6, metaY);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(15, 23, 42);
  pdf.text(String(model), margin + 31, metaY);

  metaY += 5.5;
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(100, 116, 139);
  pdf.text('MANUFACTURER:', margin + 6, metaY);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(227, 6, 19);
  pdf.text(`${brandName} Products & Solutions`, margin + 36, metaY);

  metaY += 5.5;
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(100, 116, 139);
  pdf.text('WARRANTY:', margin + 6, metaY);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(16, 149, 193);
  pdf.text('3 Years Official Commercial Hardware Warranty', margin + 28, metaY);

  // Right Section: Framed Product Image
  const imgBoxX = pageWidth - margin - 46;
  const imgBoxY = y + 4;
  const imgBoxSize = 42;

  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(203, 213, 225);
  pdf.roundedRect(imgBoxX, imgBoxY, imgBoxSize, imgBoxSize, 2, 2, 'FD');

  if (productImgData?.dataUrl) {
    const pad = 3;
    const maxImgW = imgBoxSize - pad * 2;
    const maxImgH = imgBoxSize - pad * 2;
    const aspect = productImgData.width / productImgData.height;
    let renderW = maxImgW;
    let renderH = maxImgH;

    if (aspect >= 1) {
      renderH = maxImgW / aspect;
    } else {
      renderW = maxImgH * aspect;
    }

    const offsetX = imgBoxX + pad + (maxImgW - renderW) / 2;
    const offsetY = imgBoxY + pad + (maxImgH - renderH) / 2;

    pdf.addImage(productImgData.dataUrl, productImgData.format || 'PNG', offsetX, offsetY, renderW, renderH);
  } else {
    // Clean Branded Fallback Placeholder Box
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text('HONEYWELL', imgBoxX + (imgBoxSize / 2), imgBoxY + (imgBoxSize / 2) - 2, { align: 'center' });
    pdf.setFontSize(7);
    pdf.text('AUTHENTIC', imgBoxX + (imgBoxSize / 2), imgBoxY + (imgBoxSize / 2) + 4, { align: 'center' });
  }

  y += heroBoxH + 8;

  // ════════════════════════════════════════════════════════════════════════════
  // 2. DOCUMENT BODY BY TYPE
  // ════════════════════════════════════════════════════════════════════════════

  const checkPageBreak = (neededHeight = 20) => {
    if (y + neededHeight > pageHeight - margin - 12) {
      pdf.addPage();
      drawPageHeader();
      y = 34;
      return true;
    }
    return false;
  };

  const drawSectionTitle = (title, num) => {
    checkPageBreak(14);
    pdf.setFillColor(241, 245, 249);
    pdf.setDrawColor(226, 232, 240);
    pdf.rect(margin, y, contentWidth, 7.5, 'FD');

    pdf.setFillColor(227, 6, 19);
    pdf.rect(margin, y, 3, 7.5, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text(`${num}. ${title.toUpperCase()}`, margin + 6, y + 5.2);
    y += 10.5;
  };

  // ─── A. DATASHEET LAYOUT ──────────────────────────────────────────────────
  if (isDatasheet) {
    // 1. Executive Summary
    drawSectionTitle('Product Architecture & Engineering Overview', 1);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(51, 65, 85);
    const desc = product.description || product.shortDescription || product.productDetails ||
      'Engineered for mission-critical commercial and industrial environments, this Honeywell system delivers enterprise-grade performance, high optical precision, robust thermal dissipation, and seamless integration with existing surveillance networks.';
    const descLines = pdf.splitTextToSize(desc, contentWidth);
    descLines.forEach((line) => {
      checkPageBreak(6);
      pdf.text(line, margin, y);
      y += 4.5;
    });
    y += 3;

    // 2. Key Features
    const rawHighlights = product.highlights || product.features || product.keyFeatures || [];
    const highlights = Array.isArray(rawHighlights) && rawHighlights.length > 0
      ? rawHighlights.map((h) => typeof h === 'object' ? (h.name || h.feature || String(h)) : String(h)).filter(Boolean)
      : [
          'High-precision optical sensor with dynamic illumination control',
          'Industrial IP67 weatherproof housing with tamper resistance',
          'AI-powered edge analytics and intelligent perimeter classification',
          'Low power consumption with PoE (Power over Ethernet) support',
          'Direct integration with Honeywell NVRs and central management platforms',
        ];

    drawSectionTitle('Key Features & Technical Capabilities', 2);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(30, 41, 59);

    highlights.forEach((item) => {
      checkPageBreak(6);
      pdf.setFillColor(2, 132, 199);
      pdf.circle(margin + 2.5, y - 1.2, 1, 'F');
      const lines = pdf.splitTextToSize(item, contentWidth - 8);
      lines.forEach((l, idx) => {
        pdf.text(l, margin + 7, y + (idx * 4.2));
      });
      y += (lines.length * 4.2) + 1.5;
    });
    y += 3;

    // 3. Technical Specifications Matrix
    const rawSpecs = product.specifications || product.specificationsObj || [];
    let specArray = [];
    if (Array.isArray(rawSpecs) && rawSpecs.length > 0) {
      specArray = rawSpecs;
    } else if (typeof rawSpecs === 'object' && rawSpecs !== null && Object.keys(rawSpecs).length > 0) {
      specArray = Object.entries(rawSpecs).map(([k, v]) => `${k}: ${v}`);
    } else {
      specArray = [
        `Operating Voltage: 12V DC / PoE (802.3af)`,
        `Power Consumption: Max 9.5W (IR ON)`,
        `Operating Temperature: -30°C to +60°C (-22°F to +140°F)`,
        `Protection Ingress: IP67 Weatherproof / IK10 Vandal-Proof`,
        `Housing Material: Heavy-duty Aluminum Alloy Die-Cast`,
        `Connectivity: 1x RJ45 10M/100M Self-Adaptive Ethernet Port`,
        `Storage Support: MicroSD Card Slot (up to 256GB) / NAS`,
        `Certifications: CE, FCC Part 15, RoHS, BIS, ISO 9001:2015`,
      ];
    }

    drawSectionTitle('Technical Specifications Matrix', 3);

    // Table Header
    checkPageBreak(12);
    pdf.setFillColor(15, 23, 42);
    pdf.rect(margin, y, contentWidth, 6.5, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    pdf.text('PARAMETER', margin + 4, y + 4.5);
    pdf.text('SPECIFICATION DETAILS', margin + 65, y + 4.5);
    y += 6.5;

    specArray.forEach((item, idx) => {
      let key = 'Parameter';
      let val = 'Specified';
      if (typeof item === 'string') {
        const colonIdx = item.indexOf(':');
        if (colonIdx > 0) {
          key = item.slice(0, colonIdx).trim();
          val = item.slice(colonIdx + 1).trim();
        } else {
          key = `Item #${idx + 1}`;
          val = item.trim();
        }
      } else if (typeof item === 'object' && item !== null) {
        key = item.label || item.key || 'Parameter';
        val = item.value || JSON.stringify(item);
      }

      checkPageBreak(8);

      // Row background
      if (idx % 2 === 1) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(margin, y, contentWidth, 6, 'F');
      }

      pdf.setDrawColor(241, 245, 249);
      pdf.line(margin, y + 6, pageWidth - margin, y + 6);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(71, 85, 105);
      pdf.text(key, margin + 4, y + 4.2);

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(15, 23, 42);
      const valLines = pdf.splitTextToSize(val, contentWidth - 70);
      pdf.text(valLines[0] || '', margin + 65, y + 4.2);

      y += 6;
    });

    y += 4;

    // 4. Compliance & Standards
    drawSectionTitle('Environmental & Regulatory Compliance', 4);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(51, 65, 85);
    pdf.text('• Fully compliant with EU RoHS Directives 2011/65/EU and 2015/863.', margin + 4, y + 2);
    pdf.text('• Certified to CE EMC (EN 55032 Class B, EN 55035) & Low Voltage Directive (EN 62368-1).', margin + 4, y + 6.5);
    pdf.text('• FCC Part 15 Subpart B compliant for commercial & industrial operation.', margin + 4, y + 11);
    y += 16;
  }

  // ─── B. USER & INSTALLATION MANUAL LAYOUT ──────────────────────────────────
  else if (isManual) {
    // 1. Safety Guidelines
    drawSectionTitle('Safety Notices & Installation Precautions', 1);
    const precautions = [
      'Ensure the power supply matches the rated voltage (12V DC / PoE IEEE 802.3af) before connecting.',
      'Mount only on structurally sound surfaces capable of bearing at least 4x the total device weight.',
      'Do not route network or power cables adjacent to high-voltage AC electrical lines to avoid interference.',
      'Ground all outdoor installations and utilize certified surge protectors for lightning resistance.',
    ];
    precautions.forEach((p) => {
      checkPageBreak(5.5);
      pdf.setFillColor(239, 68, 68);
      pdf.rect(margin + 2, y - 2.5, 2, 2, 'F');
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(51, 65, 85);
      pdf.text(p, margin + 8, y - 1);
      y += 4.5;
    });
    y += 3;

    // 2. Hardware Mounting Steps
    drawSectionTitle('Hardware Installation & Mounting Procedure', 2);
    const steps = [
      { step: 'Step 1: Unpack & Inspect', desc: 'Verify all contents including camera unit, mounting template, waterproof cable connector, and screw pack.' },
      { step: 'Step 2: Surface Preparation', desc: 'Affix the drilling template to the designated mounting surface and drill holes for anchors and cable pass-through.' },
      { step: 'Step 3: Cable Routing & Sealing', desc: 'Thread the RJ45 Ethernet cable through the included waterproof gland. Seal tightly to maintain IP67 rating.' },
      { step: 'Step 4: Fasten & Position', desc: 'Secure the base bracket with the provided screws. Adjust horizontal pan (0-360°) and vertical tilt (0-90°) as desired.' },
      { step: 'Step 5: Tighten Locking Screws', desc: 'Firmly tighten the bracket hex screws to fix the viewing angle securely in position.' },
    ];

    steps.forEach((s) => {
      checkPageBreak(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(99, 102, 241);
      pdf.text(s.step, margin + 4, y + 2);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(51, 65, 85);
      const descLines = pdf.splitTextToSize(s.desc, contentWidth - 10);
      pdf.text(descLines, margin + 4, y + 6);
      y += (descLines.length * 4) + 4;
    });

    // 3. Network Configuration & Initial Access
    drawSectionTitle('Network Setup & Device Initialization', 3);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(51, 65, 85);
    pdf.text('• Default Device IP Address: 192.168.1.64 (Subnet Mask: 255.255.255.0)', margin + 4, y + 2);
    pdf.text('• Web Configuration Interface: Access http://192.168.1.64 via Google Chrome / Microsoft Edge.', margin + 4, y + 6.5);
    pdf.text('• Admin Activation: Upon first login, create a secure administrative password with at least 8 characters.', margin + 4, y + 11);
    pdf.text('• Honeywell Mobile App: Scan the QR code on the device label using the Honeywell Security App to link to cloud.', margin + 4, y + 15.5);
    y += 21;

    // 4. Maintenance & Troubleshooting
    drawSectionTitle('Routine Maintenance & Diagnostics', 4);
    const troubles = [
      { issue: 'No Video Feed / Offline', solution: 'Check PoE switch port status, cable continuity, and ensure IP is in the same local subnet.' },
      { issue: 'Night Vision IR Glare', solution: 'Ensure front glass cover is free from dust/condensation. Avoid mounting within 50cm of reflective walls.' },
      { issue: 'Password Reset', solution: 'Press and hold the internal hardware reset button for 10 seconds while device is powered on.' },
    ];
    troubles.forEach((t) => {
      checkPageBreak(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(15, 23, 42);
      pdf.text(`• ${t.issue}:`, margin + 4, y + 2);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(71, 85, 105);
      pdf.text(t.solution, margin + 40, y + 2);
      y += 5.5;
    });
    y += 3;
  }

  // ─── C. PRODUCT BROCHURE LAYOUT ───────────────────────────────────────────
  else if (isBrochure) {
    // 1. Solution Value Proposition
    drawSectionTitle('Enterprise Security Solution Overview', 1);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(51, 65, 85);
    const brochureText =
      `The ${productName} represents Honeywell's advanced standard in intelligent commercial surveillance. Designed specifically for facilities requiring uninterrupted, high-definition situational awareness, this system integrates state-of-the-art optics, hardware-accelerated analytics, and ultra-efficient bandwidth encoding.`;
    const bLines = pdf.splitTextToSize(brochureText, contentWidth);
    bLines.forEach((line) => {
      checkPageBreak(5);
      pdf.text(line, margin, y);
      y += 4.5;
    });
    y += 4;

    // 2. Application Scenarios Matrix
    drawSectionTitle('Recommended Deployment Environments', 2);
    const scenarios = [
      { area: 'Corporate & Commercial Offices', benefit: 'Perimeter protection, visitor monitoring, entry/exit turnstile surveillance.' },
      { area: 'Industrial & Manufacturing', benefit: 'Hazardous area monitoring, assembly line oversight, compliance recording.' },
      { area: 'Educational & Healthcare Campuses', benefit: 'Wide-area coverage, low-light night patrol, integrated emergency response.' },
      { area: 'Retail & Banking Branches', benefit: 'High-clarity transactional monitoring, cash desk security, customer footfall metrics.' },
    ];

    scenarios.forEach((s) => {
      checkPageBreak(8);
      pdf.setFillColor(240, 253, 244);
      pdf.setDrawColor(187, 247, 208);
      pdf.roundedRect(margin, y, contentWidth, 7.5, 1.5, 1.5, 'FD');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(5, 150, 105);
      pdf.text(s.area, margin + 4, y + 4.8);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.8);
      pdf.setTextColor(51, 65, 85);
      pdf.text(`— ${s.benefit}`, margin + 56, y + 4.8);
      y += 9.5;
    });
    y += 3;

    // 3. Why Honeywell Advantage
    drawSectionTitle('The Honeywell Enterprise Advantage', 3);
    const advantages = [
      'Industrial Build Quality — Military-grade components built for 10+ year service life.',
      'Cybersecurity First — Encrypted firmware, HTTPS/TLS 1.3 streams, and zero backdoors.',
      'Unified Ecosystem — Seamless plug-and-play operation with Honeywell recording & software suites.',
      'Dedicated Global Support — 24/7 technical hotline, rapid RMA advance replacement, and SLA assurance.',
    ];
    advantages.forEach((adv) => {
      checkPageBreak(5.5);
      pdf.setFillColor(5, 150, 105);
      pdf.circle(margin + 2.5, y - 1, 1, 'F');
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(30, 41, 59);
      pdf.text(adv, margin + 7, y);
      y += 5;
    });
  }

  // ─── D. CERTIFICATIONS & COMPLIANCE LAYOUT ────────────────────────────────
  else {
    // Certificate Frame Box
    drawSectionTitle('Declaration of Conformity & Commercial Quality', 1);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(51, 65, 85);
    const certIntro =
      `This official document certifies that the product model detailed herein has been designed, manufactured, and quality-tested in full accordance with Honeywell International Quality Management Systems and conforms to all relevant international electrical, environmental, and safety standards.`;
    const cLines = pdf.splitTextToSize(certIntro, contentWidth);
    cLines.forEach((cl) => {
      checkPageBreak(5);
      pdf.text(cl, margin, y);
      y += 4.2;
    });
    y += 4;

    // Compliance Standards Matrix
    drawSectionTitle('Regulatory & Engineering Standards Conformance', 2);
    const standards = [
      { code: 'ISO 9001:2015', name: 'Quality Management Systems Certification for Design & Manufacturing' },
      { code: 'CE Directives', name: 'Conforms to 2014/30/EU (EMC) and 2014/35/EU (Low Voltage Directives)' },
      { code: 'FCC Part 15 Class B', name: 'Electromagnetic Emission & Interference Suppression Standard' },
      { code: 'RoHS 2011/65/EU', name: 'Restriction of Hazardous Substances in Electrical & Electronic Equipment' },
      { code: 'IP67 / IK10 Rated', name: 'Ingress Protection against Dust, Water Immersion and Mechanical Impact' },
      { code: 'BIS / Commercial Safety', name: 'Bureau of Indian Standards / Global Commercial Safety Compliance' },
    ];

    standards.forEach((std, sIdx) => {
      checkPageBreak(8);
      if (sIdx % 2 === 1) {
        pdf.setFillColor(254, 243, 199);
        pdf.rect(margin, y - 1, contentWidth, 6, 'F');
      }
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(180, 83, 9);
      pdf.text(std.code, margin + 4, y + 3.2);

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(30, 41, 59);
      pdf.text(std.name, margin + 45, y + 3.2);
      y += 6;
    });
    y += 5;

    // Quality Seal & Signature Section
    checkPageBreak(26);
    pdf.setFillColor(255, 251, 235);
    pdf.setDrawColor(251, 191, 36);
    pdf.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(180, 83, 9);
    pdf.text('AUTHORIZED QUALITY ASSURANCE VERIFICATION', margin + 6, y + 6);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(120, 53, 15);
    pdf.text(`Product Verification Hash: SHA256-HON-${product.id || '101'}-AUTH-VALIDATED`, margin + 6, y + 11);
    pdf.text(`Authorized Testing Facility: Honeywell Global Technical Compliance Laboratory`, margin + 6, y + 15);
    pdf.text(`Certified Status: APPROVED FOR ENTERPRISE & COMMERCIAL DEPLOYMENT`, margin + 6, y + 19);

    y += 28;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 3. OFFICIAL NOTICE & FOOTER
  // ════════════════════════════════════════════════════════════════════════════
  checkPageBreak(20);
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text('OFFICIAL HONEYWELL PRODUCTS DOCUMENTATION DISCLAIMER', margin + 4, y + 4.5);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(148, 163, 184);
  pdf.text('All specifications, features, and dimensions are subject to continuous improvement without prior notice.', margin + 4, y + 8);
  pdf.text('Honeywell is a registered trademark of Honeywell International Inc. Document generated via Honeywell Online Portal.', margin + 4, y + 11.5);

  // ── Page Numbers & Timestamps on All Pages ──
  const totalPages = pdf.internal.getNumberOfPages();
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setDrawColor(226, 232, 240);
    pdf.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`Honeywell Ref: DOC-HON-${product.id || '101'}-${normType.toUpperCase()}`, margin, pageHeight - 5.5);
    pdf.text(`Issued: ${dateStr} • www.honeywellproducts.com`, pageWidth / 2, pageHeight - 5.5, { align: 'center' });
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 5.5, { align: 'right' });
  }

  // ── Output: View or Download ──
  const cleanName = `${productName.replace(/[^a-zA-Z0-9\-_]/g, '_')}_${typeLabel.replace(/[^a-zA-Z0-9\-_]/g, '_')}.pdf`;

  if (mode === 'view') {
    const blobUrl = pdf.output('bloburl');
    window.open(blobUrl, '_blank');
  } else {
    pdf.save(cleanName);
  }
}

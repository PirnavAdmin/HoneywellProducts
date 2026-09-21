import{r as e}from"./rolldown-runtime-hePW80VL.js";import{n as t,t as n}from"./jsx-runtime-DE3RlOCf.js";import{t as r}from"./plus-lqu1lAZl.js";import{t as i}from"./printer-BJtmNXey.js";import{t as a}from"./refresh-cw-Ox4s0ZJ7.js";import{t as o}from"./trash-2-CJ96Vptb.js";import{Dt as s,Lt as c,Ot as l,tt as u}from"./index-BxFvw6i_.js";import{a as d,i as f,n as p,r as m}from"./invoices-DKKI9-NH.js";var h=e(t(),1),g=n(),_=e=>{if(!e||typeof e!=`string`)return``;let t=e.trim().replace(/^#+/,``);for(;/^(INV-|ORD-|INV|ORD)/i.test(t);)t=t.replace(/^(INV-|ORD-)/i,``).replace(/^(INV|ORD)[-\s]*/i,``).trim();return t?`INV-${t}`:``},v=()=>{let[e,t]=(0,h.useState)([]),[n,v]=(0,h.useState)({totalRevenue:`Rs. 0`,paidInvoices:0,unpaidInvoices:0,cancelledInvoices:0}),[y,b]=(0,h.useState)(!0),[x,S]=(0,h.useState)(``),[C,w]=(0,h.useState)(``),T=async(e=``)=>{b(!0),S(``);try{let n=await f(e),r=(n.invoices||[]).map(e=>({...e,invoiceId:_(e.invoiceId)}));t(r),v({totalRevenue:n.totalRevenue||`Rs. 0`,paidInvoices:n.paidInvoices||0,unpaidInvoices:n.unpaidInvoices||0,cancelledInvoices:n.cancelledInvoices||0})}catch(e){S(e.message||`Failed to fetch invoices.`)}finally{b(!1)}};(0,h.useEffect)(()=>{let e=setTimeout(()=>{T(C)},450);return()=>clearTimeout(e)},[C]);let E=async(e,t,n)=>{if(window.confirm(`This invoice is currently ${t.toUpperCase()}. Are you sure you want to mark it as ${n.toUpperCase()}?`))try{await d(e,{status:n}),T(C)}catch(e){alert(`Error: ${e.message}`)}},D=async e=>{if(window.confirm(`Are you sure you want to cancel/delete this invoice?`))try{await p(e),T(C)}catch(e){alert(`Error: ${e.message}`)}},O=async e=>{try{let t=await m(e),n=e=>{if(typeof e==`number`)return e;if(!e)return 0;let t=String(e).trim();return t=t.replace(/^(rs\.?|inr|₹)\s*/i,``),t=t.replace(/,/g,``),t=t.replace(/[^0-9.]/g,``),Number(t)||0},r=t.totalAmount===void 0?t.finalAmount===void 0?n(t.billed):Number(t.finalAmount):Number(t.totalAmount),i=Array.isArray(t.items)&&t.items.length>0?t.items:[],a=i.reduce((e,t)=>e+(t.priceNum===void 0?n(t.price):Number(t.priceNum))*Number(t.quantity||1),0),o=t.subTotal===void 0?t.subtotal===void 0?a>0?a:r/1.18:Number(t.subtotal):Number(t.subTotal),s=Number(t.discountAmount||t.discount||0),c=Number(t.shippingFee||t.shippingCharge||0),l=Math.max(0,o-s),u=t.taxAmount===void 0?t.gstAmount===void 0?l*.18:Number(t.gstAmount):Number(t.taxAmount),d=r>0?r:l+u+c,f=u/2,p=u/2,h=document.getElementById(`invoice-print-iframe`);h||(h=document.createElement(`iframe`),h.id=`invoice-print-iframe`,h.style.position=`fixed`,h.style.right=`0`,h.style.bottom=`0`,h.style.width=`0`,h.style.height=`0`,h.style.border=`0`,document.body.appendChild(h));let g=i.map((e,t)=>{let r=e.priceNum===void 0?n(e.price):Number(e.priceNum),i=Number(e.quantity||1),a=r*i,o=a*.18,s=a+o;return`
          <tr>
            <td style="text-align: center; font-weight: 600;">${t+1}</td>
            <td>
              <div style="font-weight: 700; color: #0f172a;">${e.productName||`Product`}</div>
              ${e.productCode?`<div style="font-size: 11px; color: #64748b;">SKU: ${e.productCode}</div>`:``}
            </td>
            <td style="text-align: center;">${i}</td>
            <td style="text-align: right;">₹${r.toLocaleString(`en-IN`,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
            <td style="text-align: right;">₹${o.toLocaleString(`en-IN`,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
            <td style="text-align: right; font-weight: 700; color: #0f172a;">₹${s.toLocaleString(`en-IN`,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
          </tr>
        `}).join(``),_=e=>{if(!e)return new Date().toLocaleDateString(`en-GB`,{day:`2-digit`,month:`short`,year:`numeric`});try{let t=new Date(e);return isNaN(t.getTime())?e:t.toLocaleDateString(`en-GB`,{day:`2-digit`,month:`short`,year:`numeric`})}catch{return e}},v=t.paymentStatus||t.status||`Unpaid`,y=v.toLowerCase()===`paid`,b=v.toLowerCase()===`cancelled`,x=y?`TAX INVOICE`:b?`CANCELLED INVOICE`:`PROFORMA INVOICE`,S=y?`Original for Recipient`:b?`Void / Cancelled Document`:`Proforma / Quotation - Payment Pending`,C=y?`#047857`:b?`#dc2626`:`#d97706`,w=y?`#ecfdf5`:b?`#fef2f2`:`#fffbe5`,T=y?`#a7f3d0`:b?`#fca5a5`:`#fde68a`,E=h.contentWindow||h.contentDocument,D=E.document||E;D.open(),D.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${x} - ${t.invoiceId}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
              @page {
                margin: 0;
                size: auto;
              }
              @media print {
                html, body { margin: 0 !important; padding: 0 !important; background: #ffffff !important; }
                .invoice-container { border: none !important; box-shadow: none !important; padding: 12mm 15mm !important; max-width: 100% !important; width: 100% !important; }
              }
              * { box-sizing: border-box; margin: 0; padding: 0; }
              body { 
                font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; 
                background: #ffffff;
                color: #0f172a;
                padding: 20px;
                line-height: 1.5;
              }
              .invoice-container { 
                max-width: 820px; 
                margin: auto; 
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 32px;
              }
              
              /* Header */
              .invoice-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                padding-bottom: 20px;
                border-bottom: 2px solid #0f172a;
                margin-bottom: 20px;
              }
              .company-title {
                font-size: 22px;
                font-weight: 800;
                color: #065f46;
                letter-spacing: -0.5px;
                text-transform: uppercase;
              }
              .company-subtitle {
                font-size: 11px;
                font-weight: 700;
                color: #047857;
                margin-top: 2px;
                letter-spacing: 0.5px;
              }
              .company-meta {
                font-size: 11px;
                color: #475569;
                margin-top: 6px;
                line-height: 1.5;
              }
              .badge-tax-invoice {
                text-align: right;
              }
              .tax-title {
                font-size: 20px;
                font-weight: 800;
                color: #0f172a;
                letter-spacing: 1px;
              }
              .tax-subtitle {
                display: inline-block;
                background: ${w};
                color: ${C};
                border: 1px solid ${T};
                font-size: 10px;
                font-weight: 700;
                padding: 4px 8px;
                border-radius: 20px;
                margin-top: 4px;
                text-transform: uppercase;
              }
              
              /* Metadata Grid */
              .info-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 14px 18px;
                margin-bottom: 20px;
              }
              .info-block {
                font-size: 12px;
              }
              .info-block-title {
                font-size: 10px;
                font-weight: 700;
                text-transform: uppercase;
                color: #64748b;
                letter-spacing: 0.5px;
                margin-bottom: 6px;
              }
              .info-row {
                display: flex;
                margin-bottom: 4px;
              }
              .info-label {
                width: 110px;
                color: #64748b;
                font-weight: 500;
              }
              .info-val {
                font-weight: 700;
                color: #0f172a;
              }
              
              /* Addresses Grid */
              .address-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
                margin-bottom: 20px;
              }
              .address-card {
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 14px;
              }
              .address-card-title {
                font-size: 10px;
                font-weight: 800;
                text-transform: uppercase;
                color: #047857;
                letter-spacing: 0.5px;
                margin-bottom: 6px;
              }
              .address-card p {
                font-size: 12px;
                color: #334155;
                line-height: 1.5;
              }

              /* Table */
              table.item-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
              }
              table.item-table th {
                background: #0f172a;
                color: #ffffff;
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                padding: 8px 10px;
                letter-spacing: 0.5px;
              }
              table.item-table td {
                padding: 10px;
                font-size: 12px;
                border-bottom: 1px solid #e2e8f0;
                color: #334155;
              }
              table.item-table tr:nth-child(even) {
                background: #f8fafc;
              }

              /* Summary & Financials */
              .summary-flex {
                display: flex;
                justify-content: space-between;
                gap: 20px;
                margin-bottom: 24px;
              }
              .bank-box {
                flex: 1;
                background: #f0fdf4;
                border: 1px solid #bbf7d0;
                border-radius: 8px;
                padding: 14px;
                font-size: 11px;
              }
              .bank-box-title {
                font-size: 10px;
                font-weight: 800;
                color: #166534;
                text-transform: uppercase;
                margin-bottom: 6px;
              }
              .bank-row {
                display: flex;
                margin-bottom: 3px;
              }
              .bank-label {
                width: 90px;
                color: #15803d;
                font-weight: 600;
              }
              .bank-val {
                font-weight: 700;
                color: #166534;
              }
              .financial-totals {
                width: 320px;
                font-size: 12px;
              }
              .total-line {
                display: flex;
                justify-content: space-between;
                padding: 5px 0;
                color: #475569;
                border-bottom: 1px solid #f1f5f9;
              }
              .grand-total-line {
                display: flex;
                justify-content: space-between;
                font-size: 15px;
                font-weight: 800;
                color: #0f172a;
                padding: 8px 0;
                border-top: 2px solid #0f172a;
                border-bottom: 2px solid #0f172a;
                margin-top: 4px;
              }

              /* Footer */
              .invoice-footer {
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                padding-top: 16px;
                border-top: 1px solid #e2e8f0;
                font-size: 11px;
                color: #64748b;
              }
              .signatory-box {
                text-align: center;
                width: 180px;
              }
              .signatory-line {
                height: 35px;
                border-bottom: 1px dashed #94a3b8;
                margin-bottom: 4px;
              }
            </style>
          </head>
          <body>
            <div class="invoice-container">
              <!-- Header -->
              <div class="invoice-header">
                <div style="display: flex; align-items: flex-start; gap: 18px;">
                  <img src="/honeywell-products-logo.png" style="height: 70px; width: auto; object-fit: contain; margin-top: 4px;" alt="Honeywell Products" />
                  <div>
                    <div class="company-title">Honeywell</div>
                    <div class="company-subtitle">SECURITY & SURVEILLANCE SOLUTIONS</div>
                    <div class="company-meta">
                      101, Jain Sadguru Capital Park, Hitech City, Madhapur, Hyderabad - 500081, Telangana<br/>
                      GSTIN: <strong>24DYYPP1677P1Z6</strong> | Phone: 040 4855 5758<br/>
                      Email: info@honeywellproducts.com
                    </div>
                  </div>
                </div>
                <div class="badge-tax-invoice">
                  <div class="tax-title">${x}</div>
                  <div class="tax-subtitle">${S}</div>
                </div>
              </div>

              <!-- Info Grid -->
              <div class="info-grid">
                <div class="info-block">
                  <div class="info-block-title">Invoice & Order Details</div>
                  <div class="info-row"><span class="info-label">Invoice No:</span><span class="info-val">${t.invoiceId}</span></div>
                  <div class="info-row"><span class="info-label">Invoice Date:</span><span class="info-val">${_(t.date)}</span></div>
                  <div class="info-row"><span class="info-label">Order Ref ID:</span><span class="info-val">ORD-${t.id}</span></div>
                  <div class="info-row"><span class="info-label">Place of Supply:</span><span class="info-val">Andhra Pradesh (37)</span></div>
                </div>
                <div class="info-block">
                  <div class="info-block-title">Payment & Settlement Status</div>
                  <div class="info-row"><span class="info-label">Payment Method:</span><span class="info-val">${t.paymentMethod||`UPI / Bank Transfer`}</span></div>
                  <div class="info-row"><span class="info-label">Payment Status:</span><span class="info-val" style="color: ${C}; font-weight: 800;">${v.toUpperCase()} ${!y&&!b?`(Payment Pending)`:``}</span></div>
                  <div class="info-row"><span class="info-label">Billing Currency:</span><span class="info-val">INR ₹${d.toLocaleString(`en-IN`,{minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>
                </div>
              </div>

              <!-- Customer & Shipping Addresses -->
              <div class="address-grid">
                <div class="address-card">
                  <div class="address-card-title">Billed To (Customer Details)</div>
                  <p>
                    <strong>${t.client}</strong><br/>
                    ${t.address&&t.address!==`N/A`?`Address: ${t.address.replace(/\n/g,`<br/>`)}<br/>`:``}
                    ${t.phone?`Phone: ${t.phone}<br/>`:``}
                    ${t.email&&!t.email.includes(`N/A`)?`Email: ${t.email.toLowerCase()}<br/>`:``}
                  </p>
                </div>
                <div class="address-card">
                  <div class="address-card-title">Shipped To (Delivery Destination)</div>
                  <p>
                    <strong>${t.client}</strong><br/>
                    Address: ${(t.shippingAddress||t.address||`Full Delivery Address Pending / Not Provided`).replace(/\n/g,`<br/>`)}<br/>
                    ${t.phone?`Contact Phone: ${t.phone}<br/>`:``}
                    ${t.email&&!t.email.includes(`N/A`)?`Email: ${t.email.toLowerCase()}<br/>`:``}
                  </p>
                </div>
              </div>

              <!-- Items Table -->
              <table class="item-table">
                <thead>
                  <tr>
                    <th style="width: 5%;">#</th>
                    <th style="width: 45%; text-align: left;">Product Description</th>
                    <th style="width: 10%; text-align: center;">Qty</th>
                    <th style="width: 13%; text-align: right;">Price</th>
                    <th style="width: 12%; text-align: right;">GST (18%)</th>
                    <th style="width: 15%; text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${g}
                </tbody>
              </table>

              <!-- Summary Flex -->
              <div class="summary-flex">
                <div class="bank-box">
                  <div class="bank-box-title">Remittance / Bank Account Details</div>
                  <div class="bank-row"><span class="bank-label">Bank Name:</span><span class="bank-val">State Bank of India</span></div>
                  <div class="bank-row"><span class="bank-label">Account Name:</span><span class="bank-val">Honeywell</span></div>
                  <div class="bank-row"><span class="bank-label">Account No:</span><span class="bank-val">50200012345678</span></div>
                  <div class="bank-row"><span class="bank-label">IFSC Code:</span><span class="bank-val">SBIN0001234</span></div>
                  <div class="bank-row"><span class="bank-label">UPI VPA:</span><span class="bank-val">sales@honeywell.local</span></div>
                </div>

                <div class="financial-totals">
                  <div class="total-line"><span>Subtotal (Taxable Value)</span><span>₹${o.toLocaleString(`en-IN`,{minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>
                  ${s>0?`<div class="total-line" style="color: #dc2626;"><span>Discount</span><span>-₹${s.toLocaleString(`en-IN`,{minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>`:``}
                  ${c>0?`<div class="total-line"><span>Shipping Charges</span><span>₹${c.toLocaleString(`en-IN`,{minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>`:``}
                  <div class="total-line"><span>CGST (9%)</span><span>₹${f.toLocaleString(`en-IN`,{minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>
                  <div class="total-line"><span>SGST (9%)</span><span>₹${p.toLocaleString(`en-IN`,{minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>
                  <div class="grand-total-line">
                    <span>Grand Total Due</span>
                    <span>₹${d.toLocaleString(`en-IN`,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
                  </div>
                </div>
              </div>

              <!-- Footer & About Section -->
              <div class="invoice-footer">
                <div style="flex-grow: 1; max-width: 65%;">
                  <strong>About Honeywell:</strong><br/>
                  Leading provider of professional security, surveillance, and smart technology solutions.<br/><br/>
                  <strong>About Invoice & Notes:</strong><br/>
                  ${t.packerName||t.notes||`Official tax & commercial invoice generated for recipient commercial use. Valid for commercial warranty and tax deduction.`}<br/>
                  <span style="font-size: 10px; color: #64748b;">1. Goods once sold will not be returned without valid RMA approval. 2. Subject to Hyderabad Jurisdiction only.</span><br/>
                  <em>This is a computer-generated tax invoice requiring no physical signature.</em>
                </div>
                <div class="signatory-box">
                  <div class="signatory-line"></div>
                  <strong>For Honeywell</strong><br/>
                  <span>Authorized Signatory</span>
                </div>
              </div>
            </div>
            <script>
              window.onload = function() {
                window.focus();
                window.print();
              }
            <\/script>
          </body>
        </html>
      `),D.close();try{D.title=`${x} - ${t.invoiceId}`}catch{}setTimeout(()=>{E.focus(),E.print()},300)}catch(e){alert(`Failed to print invoice: ${e.message}`)}};return(0,g.jsxs)(`div`,{className:`invoices-ledger-container`,children:[(0,g.jsxs)(`div`,{className:`invoices-header-flex`,children:[(0,g.jsxs)(`div`,{children:[(0,g.jsx)(`h1`,{className:`invoices-title`,children:`Invoices Manager`}),(0,g.jsx)(`p`,{className:`invoices-subtitle`,children:`Track, search, and generate customer and staff sales invoices.`})]}),(0,g.jsxs)(c,{to:`/admin/invoice/add`,className:`add-invoice-button`,children:[(0,g.jsx)(r,{size:16}),` Create Invoice`]})]}),(0,g.jsxs)(`div`,{className:`invoices-metrics-grid`,children:[(0,g.jsx)(`div`,{className:`invoice-metric-card revenue`,children:(0,g.jsxs)(`div`,{className:`metric-info`,children:[(0,g.jsx)(`span`,{className:`metric-label`,children:`Total Revenue`}),(0,g.jsx)(`h3`,{className:`metric-value`,children:n.totalRevenue})]})}),(0,g.jsx)(`div`,{className:`invoice-metric-card success`,children:(0,g.jsxs)(`div`,{className:`metric-info`,children:[(0,g.jsx)(`span`,{className:`metric-label`,children:`Paid Invoices`}),(0,g.jsx)(`h3`,{className:`metric-value`,children:n.paidInvoices})]})}),(0,g.jsx)(`div`,{className:`invoice-metric-card warning`,children:(0,g.jsxs)(`div`,{className:`metric-info`,children:[(0,g.jsx)(`span`,{className:`metric-label`,children:`Unpaid Invoices`}),(0,g.jsx)(`h3`,{className:`metric-value`,children:n.unpaidInvoices})]})}),(0,g.jsx)(`div`,{className:`invoice-metric-card danger`,children:(0,g.jsxs)(`div`,{className:`metric-info`,children:[(0,g.jsx)(`span`,{className:`metric-label`,children:`Cancelled`}),(0,g.jsx)(`h3`,{className:`metric-value`,children:n.cancelledInvoices})]})})]}),(0,g.jsx)(`div`,{className:`invoices-filter-card`,children:(0,g.jsxs)(`div`,{className:`search-input-wrapper`,children:[(0,g.jsx)(u,{size:18,className:`search-icon-svg`}),(0,g.jsx)(`input`,{type:`text`,placeholder:`Search by client, invoice number, or email...`,value:C,onChange:e=>w(e.target.value),className:`invoice-search-input`})]})}),(0,g.jsx)(`div`,{className:`invoice-table-card`,children:y?(0,g.jsxs)(`div`,{className:`invoice-loading-state`,children:[(0,g.jsx)(a,{size:24,className:`animate-spin`}),(0,g.jsx)(`span`,{children:`Loading Invoices...`})]}):x?(0,g.jsxs)(`div`,{className:`invoice-error-state`,children:[(0,g.jsx)(l,{size:24}),(0,g.jsx)(`span`,{children:x})]}):e.length===0?(0,g.jsxs)(`div`,{className:`invoice-empty-state`,children:[(0,g.jsx)(l,{size:24}),(0,g.jsx)(`span`,{children:`No invoices found.`})]}):(0,g.jsx)(`div`,{className:`table-responsive`,children:(0,g.jsxs)(`table`,{className:`invoices-data-table`,children:[(0,g.jsx)(`thead`,{children:(0,g.jsxs)(`tr`,{children:[(0,g.jsx)(`th`,{children:`Invoice ID`}),(0,g.jsx)(`th`,{children:`Client`}),(0,g.jsx)(`th`,{children:`Date`}),(0,g.jsx)(`th`,{children:`Billed Amount`}),(0,g.jsx)(`th`,{children:`Status`}),(0,g.jsx)(`th`,{style:{textAlign:`center`},children:`Actions`})]})}),(0,g.jsx)(`tbody`,{children:e.map(e=>(0,g.jsxs)(`tr`,{children:[(0,g.jsx)(`td`,{style:{fontWeight:600,color:`#0f172a`},children:e.invoiceId}),(0,g.jsx)(`td`,{children:(0,g.jsxs)(`div`,{className:`client-cell-info`,children:[(0,g.jsx)(`strong`,{children:e.client}),(0,g.jsx)(`span`,{children:e.email})]})}),(0,g.jsx)(`td`,{children:e.date}),(0,g.jsx)(`td`,{style:{fontWeight:700,color:`#10b981`},children:e.billed}),(0,g.jsx)(`td`,{children:(0,g.jsx)(`span`,{className:`invoice-status-badge ${e.status?e.status.toLowerCase().replace(/\s+/g,`-`):`unpaid`}`,children:e.status})}),(0,g.jsx)(`td`,{children:(0,g.jsxs)(`div`,{className:`invoice-action-buttons`,children:[(0,g.jsxs)(`button`,{onClick:()=>O(e.id),className:`inv-action-btn print`,title:`Print / View PDF`,children:[(0,g.jsx)(i,{size:14}),` Print`]}),e.status?.toLowerCase()!==`cancelled`&&(()=>{let t=(e.status||``).toLowerCase(),n=t.includes(`not applicable`)||t.includes(`n/a`)||t.includes(`not required`)||t===`na`,r=t===`paid`?`Unpaid`:`Paid`;return(0,g.jsxs)(`button`,{onClick:()=>!n&&E(e.id,e.status,r),disabled:n,className:`inv-action-btn toggle ${n?`disabled`:``}`,title:n?`Payment is not required for this invoice`:`Mark as ${r}`,children:[(0,g.jsx)(s,{size:14}),` Mark as `,r]})})(),e.status!==`Cancelled`&&(0,g.jsxs)(`button`,{onClick:()=>D(e.id),className:`inv-action-btn delete`,title:`Cancel Invoice`,children:[(0,g.jsx)(o,{size:14}),` Cancel`]})]})})]},e.id))})]})})})]})};export{v as default};
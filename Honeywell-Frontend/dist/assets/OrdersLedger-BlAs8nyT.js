import{r as e}from"./rolldown-runtime-hePW80VL.js";import{n as t,t as n}from"./jsx-runtime-DE3RlOCf.js";import{t as r}from"./calendar-aHaI8L8I.js";import{t as i}from"./clock-3-BeuYtSj2.js";import{t as a}from"./dollar-sign-Db5jmbCj.js";import{t as o}from"./package-Bed3UOUC.js";import{t as s}from"./printer-BJtmNXey.js";import{t as c}from"./trash-2-CJ96Vptb.js";import{t as l}from"./apiConfig-DpcBaxS1.js";import{B as u,Ct as d,Dt as f,H as p,Ot as m,Q as h,R as g,Vt as _,nt as v,ot as y,st as b,tt as x}from"./index-BxFvw6i_.js";import{i as S}from"./ActionButtons-6hJFZHzu.js";import{o as C,r as w,t as T}from"./orders-DY87uXgc.js";var E=e(t(),1),D=n(),O=e=>{if(!e||typeof e!=`string`)return``;let t=e.trim();if(!t)return``;if(t.toLowerCase().includes(`placeholder`)||t.includes(`honeywell-products-logo.png`))return`/honeywell-products-logo.png`;if(t.startsWith(`data:`)||t.startsWith(`blob:`)||t.startsWith(`/honeywell-products-logo.png`)||t.startsWith(`/admin-`)||t.startsWith(`/favicon`)||/^https?:\/\//i.test(t))return t;if(t.includes(`/uploads/`)){let e=t.slice(t.indexOf(`/uploads/`));return`${(l()||``).replace(/\/$/,``)}${e}`}if(t.startsWith(`/assets/`)||t.startsWith(`assets/`)||t.startsWith(`/images/`)||t.startsWith(`images/`)||t.startsWith(`/honeywell-products-logo`))return t.startsWith(`/`)?t:`/${t}`;let n=(l()||``).replace(/\/$/,``);return n?`${n}${t.startsWith(`/`)?``:`/`}${t}`:t.startsWith(`/`)?t:`/${t}`},k=e=>{if(e==null)return`INR 0`;if(typeof e==`string`&&e.trim().startsWith(`INR`))return e;let t=String(e||0).trim().replace(/^(rs\.?|inr|₹)\s*/i,``).replace(/,/g,``).replace(/[^0-9.]/g,``),n=typeof e==`number`?e:parseFloat(t);return`INR ${(isNaN(n)?0:n).toLocaleString(`en-IN`)}`},A={Completed:{icon:f,className:`status-pill completed`},Processing:{icon:f,className:`status-pill processing`},Confirmed:{icon:f,className:`status-pill confirmed`},Dispatched:{icon:p,className:`status-pill dispatched`},Cancelled:{icon:m,className:`status-pill cancelled`},Packed:{icon:o,className:`status-pill packed`},Pending:{icon:i,className:`status-pill pending`}},j=({status:e})=>{let t=A[e]||A.Pending,n=t.icon;return(0,D.jsxs)(`span`,{className:t.className,children:[(0,D.jsx)(n,{size:12,style:{marginRight:`4px`}}),e]})},M=({paymentStatus:e})=>{let t=i,n=`#d97706`,r=`#fffbeb`,a=e||`Pending`;return e===`Verified`||e===`Verified Paid`||e===`Paid`||e===`Success`?(t=h,n=`#059669`,r=`#ecfdf5`,a=`Verified`):e===`Refunded`?(t=m,n=`#7e22ce`,r=`#f3e8ff`,a=`Refunded`):e===`Payment Not Applicable`||e===`N/A`||e===`Cancelled`||e===`Canceled`?(t=m,n=`#64748b`,r=`#f1f5f9`,a=`Payment Not Applicable`):e===`Pending Verification`||e===`PendingVerification`?(t=i,n=`#d97706`,r=`#fffbeb`,a=`Pending Verification`):(e===`Pending`||e===`Unpaid`)&&(t=i,n=`#d97706`,r=`#fffbeb`,a=`Pending`),(0,D.jsxs)(`span`,{style:{display:`inline-flex`,alignItems:`center`,gap:`4px`,fontSize:`11px`,fontWeight:700,color:n,backgroundColor:r,padding:`4px 10px`,borderRadius:`9999px`,textTransform:`uppercase`},children:[(0,D.jsx)(t,{size:12}),a]})},N=e=>{if(typeof e==`number`)return e;if(!e)return 0;let t=String(e).trim().replace(/^(rs\.?|inr|₹)\s*/i,``).replace(/,/g,``).replace(/[^0-9.]/g,``),n=parseFloat(t);return isNaN(n)?0:n},P=(e,t)=>{if(!e)return`Pending`;let n=e.toUpperCase(),r=(t||``).toUpperCase();return n===`CANCELLED`||n===`CANCELED`?`Cancelled`:n===`COMPLETED`||n===`DELIVERED`?`Completed`:n===`SHIPPED`||n===`DISPATCHED`?`Dispatched`:n===`PACKED`?`Packed`:(r===`PAID`||r===`VERIFIED PAID`||r===`SUCCESS`||r===`PAID VERIFIED`||r===`VERIFIED`)&&(n===`PENDING`||n===`PLACED`||n===`PROCESSING`||n===`CONFIRMED`)||n===`CONFIRMED`?`Confirmed`:n===`PROCESSING`?`Processing`:e},F=e=>{if(!e)return`Cash on Delivery`;let t=String(e).trim().toUpperCase();return t===`CASH`||t===`CASHONDELIVERY`||t===`CASH ON DELIVERY`||t===`COD`?`Cash on Delivery`:t===`UPI`||t===`QRPAYMENT`||t===`UPI / BANK TRANSFER`||t===`BANK TRANSFER`?`UPI / Bank Transfer`:t===`CARD`||t===`CREDIT CARD`||t===`DEBIT CARD`?`Card`:t===`NETBANKING`||t===`NET BANKING`?`Net Banking`:e},I=e=>{if(!e)return`Pending`;let t=e.trim().toUpperCase();return t===`PAID`||t===`VERIFIED PAID`||t===`PAID VERIFIED`||t===`SUCCESS`||t===`VERIFIED`?`Verified`:t===`PENDING`||t===`UNPAID`||t===`PENDING VERIFICATION`||t===`PENDINGVERIFICATION`?`Pending Verification`:t===`REFUNDED`?`Refunded`:t===`CANCELLED`||t===`CANCELED`||t===`N/A`||t===`PAYMENT NOT APPLICABLE`?`Payment Not Applicable`:e},L=e=>{let t=N(e.finalAmount||e.totalAmount||e.total),n=P(e.fulfillment||e.status,e.paymentStatus),r=I(e.paymentStatus);return n===`Cancelled`||(e.fulfillment||e.status||``).toUpperCase()===`CANCELLED`||(e.fulfillment||e.status||``).toUpperCase()===`CANCELED`?r=r===`Verified`||r===`Refunded`?`Refunded`:`Payment Not Applicable`:(n===`Completed`||(e.fulfillment||e.status||``).toUpperCase()===`COMPLETED`||(e.fulfillment||e.status||``).toUpperCase()===`DELIVERED`)&&(r=`Verified`),r===`Verified`&&n===`Pending`&&(n=`Confirmed`),{id:e.id||e.orderId||``,invoiceNo:(()=>{let t=String(e.invoiceNo||e.invoiceNumber||e.orderNumber||e.id||``).trim().replace(/^#+/,``);for(;/^(INV-|ORD-|INV|ORD)/i.test(t);)t=t.replace(/^(INV-|ORD-)/i,``).replace(/^(INV|ORD)[-\s]*/i,``).trim();return t?`INV-${t}`:`INV-${new Date().toISOString().slice(0,10).replace(/-/g,``)}-${Math.floor(1e5+Math.random()*9e5)}`})(),customer:e.customerName||e.customer||e.customerDetails?.name||`Unknown`,customerType:e.customerType||e.customerRole||e.customerDetails?.type||`Farmer`,phone:e.customerPhone||e.phone||e.customerDetails?.phone||``,email:e.customerEmail||e.email||e.customerDetails?.email||``,date:e.dateBooked?e.dateBooked.slice(0,10):e.orderDate?e.orderDate.slice(0,10):e.date?e.date.slice(0,10):``,deliveryDate:e.deliveryDate?e.deliveryDate.slice(0,10):e.expectedDelivery||`TBD`,subtotal:N(e.totalAmount||0),shippingFee:N(e.shippingFee||0),gstAmount:N(e.gstAmount||0),discountAmount:N(e.discountAmount||0),total:t,paid:e.paidAmount===void 0?e.paymentStatus===`Paid`?t:0:N(e.paidAmount),status:n,paymentStatus:r,payMethod:F(e.paymentMethod||e.payMethod),utr:e.utr||``,logistics:e.carrierName||e.logisticsPartner||e.logistics||``,trackingNo:e.trackingNumber||e.trackingNo||``,shippingAddress:e.shippingAddress||``,billingAddress:e.billingAddress||e.shippingAddress||``,notes:e.notes||e.adminNotes||``,isPacked:!!(e.packerName&&e.packerName!==`Thank you for shopping with Honeywell!`)||[`PACKED`,`DISPATCHED`,`SHIPPED`,`COMPLETED`].includes((e.fulfillment||e.status||``).toUpperCase())||!!(e.carrierName||e.trackingNumber),packerName:e.packerName&&e.packerName!==`Thank you for shopping with Honeywell!`?e.packerName:e.carrierName||e.trackingNumber||[`PACKED`,`DISPATCHED`,`SHIPPED`,`COMPLETED`].includes((e.fulfillment||e.status||``).toUpperCase())?`Warehouse Team`:``,packerImage:O(e.packerPhotoUrl||e.packerImage||``),packedDate:e.packedDate||(e.packerName||e.carrierName||e.trackingNumber||[`PACKED`,`DISPATCHED`,`SHIPPED`,`COMPLETED`].includes((e.fulfillment||e.status||``).toUpperCase())?`Verified`:``),isShipped:!!(e.carrierName||e.trackingNumber)||[`DISPATCHED`,`SHIPPED`,`COMPLETED`].includes((e.fulfillment||e.status||``).toUpperCase()),shipperName:e.shipperName||e.carrierName||`Warehouse Team`,packageImage:O(e.packagePhotoUrl||e.packageImage||``),shippedDate:e.shippedDate||(e.carrierName||e.trackingNumber?`Verified`:``),items:Array.isArray(e.items)?e.items.map(e=>({sku:e.sku||e.productCode||``,name:e.name||e.productName||``,category:e.category||e.categoryName||``,qty:Number(e.quantity||e.qty||0),price:Number(e.price||e.unitPrice||0)})):[],timeline:Array.isArray(e.timeline)?e.timeline:Array.isArray(e.timelineLogs)?e.timelineLogs.map(e=>({label:e.status,date:`${e.date} ${e.time}`,completed:!0,description:e.description})):[]}},R=e=>{if(!e)return``;let t=(e.includes(`T`)?e.split(`T`)[0]:e).split(`-`);if(t.length===3){let e=t[0],n=parseInt(t[1],10)-1;return`${t[2]}-${[`Jan`,`Feb`,`Mar`,`Apr`,`May`,`Jun`,`Jul`,`Aug`,`Sep`,`Oct`,`Nov`,`Dec`][n]}-${e}`}return e},z=e=>{let t=document.getElementById(`orders-print-iframe`);t||(t=document.createElement(`iframe`),t.id=`orders-print-iframe`,t.style.position=`fixed`,t.style.right=`0`,t.style.bottom=`0`,t.style.width=`0`,t.style.height=`0`,t.style.border=`0`,document.body.appendChild(t));let n=(e.paymentStatus||e.status||``).toLowerCase()===`paid`,r=(e.paymentStatus||e.status||``).toLowerCase()===`cancelled`,i=n?`TAX INVOICE`:r?`CANCELLED INVOICE`:`PROFORMA INVOICE`,a=n?`Original for Recipient`:r?`Void / Cancelled Document`:`Proforma / Quotation - Payment Pending`,o=n?`#047857`:r?`#dc2626`:`#d97706`,s=n?`#ecfdf5`:r?`#fef2f2`:`#fffbe5`,c=n?`#a7f3d0`:r?`#fca5a5`:`#fde68a`,l=e.gstAmount>0&&e.subtotal>0?e.gstAmount/(e.subtotal-(e.discountAmount||0)):.18,u=(e.items||[]).map((e,t)=>{let n=e.price,r=n*l*e.qty,i=n*e.qty+r;return`
      <tr>
        <td style="text-align: center; font-weight: 600;">${t+1}</td>
        <td>
          <div style="font-weight: 700; color: #0f172a;">${e.name}</div>
          <div style="font-size: 11px; color: #64748b;">SKU: ${e.sku}</div>
        </td>
        <td style="text-align: center;">${e.qty}</td>
        <td style="text-align: right;">₹${n.toLocaleString(`en-IN`,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
        <td style="text-align: right;">₹${r.toLocaleString(`en-IN`,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
        <td style="text-align: right; font-weight: 700; color: #0f172a;">₹${i.toLocaleString(`en-IN`,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
      </tr>
    `}).join(``),d=e.gstAmount/2,f=e.gstAmount/2,p=t.contentWindow||t.contentDocument,m=p.document||p;m.open(),m.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${i} - ${e.invoiceNo}</title>
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
            background: ${s};
            color: ${o};
            border: 1px solid ${c};
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
              <div class="tax-title">${i}</div>
              <div class="tax-subtitle">${a}</div>
            </div>
          </div>

          <!-- Info Grid -->
          <div class="info-grid">
            <div class="info-block">
              <div class="info-block-title">Invoice & Order Details</div>
              <div class="info-row"><span class="info-label">Invoice No:</span><span class="info-val">${e.invoiceNo}</span></div>
              <div class="info-row"><span class="info-label">Invoice Date:</span><span class="info-val">${R(e.date)}</span></div>
              <div class="info-row"><span class="info-label">Order Ref ID:</span><span class="info-val">ORD-${e.id}</span></div>
              <div class="info-row"><span class="info-label">Place of Supply:</span><span class="info-val">Telangana (36)</span></div>
            </div>
            <div class="info-block">
              <div class="info-block-title">Payment & Settlement Status</div>
              <div class="info-row"><span class="info-label">Payment Method:</span><span class="info-val">${e.payMethod||`UPI / Bank Transfer`}</span></div>
              <div class="info-row"><span class="info-label">Payment Status:</span><span class="info-val" style="color: ${o};">${(e.paymentStatus||(n?`Paid`:`Unpaid`)).toUpperCase()} ${!n&&!r?`(Payment Pending)`:``}</span></div>
              <div class="info-row"><span class="info-label">Billing Currency:</span><span class="info-val">INR ₹${(e.totalAmount||e.finalAmount||0).toLocaleString(`en-IN`,{minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>
            </div>
          </div>

          <!-- Customer & Shipping Addresses -->
          <div class="address-grid">
            <div class="address-card">
              <div class="address-card-title">Billed To (Customer Details)</div>
              <p>
                <strong>${e.customer}</strong><br/>
                ${e.billingAddress||e.shippingAddress||e.address?`Address: ${(e.billingAddress||e.shippingAddress||e.address).replace(/\n/g,`<br/>`)}<br/>`:``}
                ${e.phone?`Phone: ${e.phone}<br/>`:``}
                ${e.email?`Email: ${e.email.toLowerCase()}<br/>`:``}
              </p>
            </div>
            <div class="address-card">
              <div class="address-card-title">Shipped To (Delivery Destination)</div>
              <p>
                <strong>${e.customer}</strong><br/>
                Address: ${(e.shippingAddress||e.billingAddress||e.address||`Full Delivery Address Pending / Not Provided`).replace(/\n/g,`<br/>`)}<br/>
                ${e.phone?`Contact Phone: ${e.phone}<br/>`:``}
                ${e.email?`Email: ${e.email.toLowerCase()}<br/>`:``}
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
              ${u}
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
              <div class="total-line"><span>Subtotal (Taxable Value)</span><span>₹${e.subtotal.toLocaleString(`en-IN`,{minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>
              ${e.discountAmount>0?`<div class="total-line" style="color: #dc2626;"><span>Discount</span><span>-₹${e.discountAmount.toLocaleString(`en-IN`,{minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>`:``}
              ${e.shippingFee>0?`<div class="total-line"><span>Shipping Charges</span><span>₹${e.shippingFee.toLocaleString(`en-IN`,{minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>`:``}
              <div class="total-line"><span>CGST (9%)</span><span>₹${d.toLocaleString(`en-IN`,{minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>
              <div class="total-line"><span>SGST (9%)</span><span>₹${f.toLocaleString(`en-IN`,{minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>
              <div class="grand-total-line">
                <span>Grand Total Due</span>
                <span>₹${e.total.toLocaleString(`en-IN`,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="invoice-footer">
            <div>
              <strong>Terms & Memos:</strong><br/>
              1. Goods once sold will not be taken back without valid return approval.<br/>
              2. Subject to Hyderabad Jurisdiction only.<br/>
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
  `),m.close();try{m.title=`${i} - ${e.invoiceNo}`}catch{}setTimeout(()=>{p.focus(),p.print()},300)},B=e=>{if(!e)return``;let t=(e.includes(`T`)?e.split(`T`)[0]:e).split(`-`);return t.length===3?`${t[2]}-${t[1]}-${t[0]}`:e},V=()=>{let e=_(),[t,n]=(0,E.useState)([]),[o,m]=(0,E.useState)(!0),[h,O]=(0,E.useState)(``),[A,N]=(0,E.useState)(``),[P,F]=(0,E.useState)(`All`),[I,R]=(0,E.useState)(``),[V,H]=(0,E.useState)(``),[U,W]=(0,E.useState)(null);(0,E.useEffect)(()=>{if(e.state?.selectedOrderId&&t.length>0){let n=t.find(t=>String(t.id||t.orderId)===String(e.state.selectedOrderId));n&&W(n)}},[e.state,t]);let[G,K]=(0,E.useState)(1);(0,E.useEffect)(()=>{let e=!0;return(async()=>{try{m(!0),O(``);let t=await C(),r={};try{let e=await fetch(`${l()}/api/Customers`,{headers:{"ngrok-skip-browser-warning":`true`,Accept:`application/json`}});e.ok&&(await e.json()).forEach(e=>{r[e.id]=e})}catch(e){console.warn(`Failed to load customers for mapping:`,e)}if(e){let e=(Array.isArray(t)?t:t.orders||t.data||[]).map(e=>{let t=L(e),n=r[e.customerId];return n&&(t.customer=n.name||t.customer,t.customerType=n.role||`Farmer`,t.phone=n.phone||t.phone,t.email=n.email||t.email,t.shippingAddress=n.address||t.shippingAddress),t}),i=new Map;e.forEach(e=>{let t=(e.invoiceNo||e.id||``).toUpperCase().trim();t&&!i.has(t)&&i.set(t,e)}),n(Array.from(i.values()))}}catch(t){e&&O(t.message||`Failed to load orders.`)}finally{e&&m(!1)}})(),()=>{e=!1}},[]);let q=(0,E.useMemo)(()=>t,[t]),J=(0,E.useMemo)(()=>{let e=A.trim().toLowerCase(),t=new Date().toISOString().slice(0,10),n=new Date;n.setDate(n.getDate()-7);let r=n.toISOString().slice(0,10),i=new Date;i.setDate(i.getDate()-30);let a=i.toISOString().slice(0,10);return q.filter(n=>{let i=[n.id,n.customer,n.invoiceNo,n.phone,n.utr].filter(Boolean).some(t=>String(t).toLowerCase().includes(e)),o=!0;return P===`Today`?o=n.date===t:P===`Week`?o=n.date>=r&&n.date<=t:P===`Month`?o=n.date>=a&&n.date<=t:P===`Custom`&&(I&&V?o=n.date>=I&&n.date<=V:I?o=n.date>=I:V&&(o=n.date<=V)),i&&o}).sort((e,t)=>Number(t.id)-Number(e.id))},[q,A,P,I,V]);(0,E.useEffect)(()=>{K(1)},[A,P,I,V]);let Y=(0,E.useMemo)(()=>t.reduce((e,t)=>{let n=t.paymentStatus?.toLowerCase()||``,r=n.includes(`paid`)||n.includes(`verified`)||n.includes(`success`);return{revenue:e.revenue+(r?t.total:0),completed:e.completed+ +(t.status===`Completed`),dispatched:e.dispatched+ +(t.status===`Dispatched`),processing:e.processing+ +(t.status===`Processing`)}},{revenue:0,completed:0,dispatched:0,processing:0}),[t]),X=Math.ceil(J.length/10),Z=J.slice((G-1)*10,G*10);return o?(0,D.jsx)(`div`,{className:`orders-mgmt-container`,style:{padding:`24px`},children:(0,D.jsx)(`div`,{className:`orders-mgmt-header`,children:(0,D.jsxs)(`div`,{className:`orders-mgmt-title`,children:[(0,D.jsx)(`h1`,{children:`Orders Ledger`}),(0,D.jsx)(`p`,{children:`Loading verified orders ledger...`})]})})}):h?(0,D.jsx)(`div`,{className:`orders-mgmt-container`,style:{padding:`24px`},children:(0,D.jsx)(`div`,{className:`orders-mgmt-header`,children:(0,D.jsxs)(`div`,{className:`orders-mgmt-title`,children:[(0,D.jsx)(`h1`,{children:`Orders Ledger`}),(0,D.jsx)(`p`,{style:{color:`#dc2626`,fontWeight:600},children:h})]})})}):(0,D.jsxs)(`div`,{className:`orders-mgmt-container`,style:{padding:`24px`},children:[(0,D.jsx)(`div`,{className:`orders-mgmt-header`,children:(0,D.jsxs)(`div`,{className:`orders-mgmt-title`,children:[(0,D.jsx)(`h1`,{children:`Orders Ledger`}),(0,D.jsx)(`p`,{children:`Complete ledger of all orders with successfully verified payment credentials.`})]})}),(0,D.jsxs)(`div`,{className:`orders-stats-grid`,children:[(0,D.jsxs)(`div`,{className:`orders-stat-card`,children:[(0,D.jsx)(`div`,{className:`stat-card-icon`,style:{background:`#ecfdf5`,color:`#059669`},children:(0,D.jsx)(a,{size:22})}),(0,D.jsxs)(`div`,{className:`stat-card-info`,children:[(0,D.jsx)(`span`,{children:`Verified Revenue`}),(0,D.jsx)(`strong`,{children:k(Y.revenue)})]})]}),(0,D.jsxs)(`div`,{className:`orders-stat-card`,children:[(0,D.jsx)(`div`,{className:`stat-card-icon`,style:{background:`#fffbeb`,color:`#d97706`},children:(0,D.jsx)(i,{size:22})}),(0,D.jsxs)(`div`,{className:`stat-card-info`,children:[(0,D.jsx)(`span`,{children:`Processing`}),(0,D.jsx)(`strong`,{children:Y.processing})]})]}),(0,D.jsxs)(`div`,{className:`orders-stat-card`,children:[(0,D.jsx)(`div`,{className:`stat-card-icon`,style:{background:`#e0e7ff`,color:`#4f46e5`},children:(0,D.jsx)(p,{size:22})}),(0,D.jsxs)(`div`,{className:`stat-card-info`,children:[(0,D.jsx)(`span`,{children:`Dispatched`}),(0,D.jsx)(`strong`,{children:Y.dispatched})]})]}),(0,D.jsxs)(`div`,{className:`orders-stat-card`,children:[(0,D.jsx)(`div`,{className:`stat-card-icon`,style:{background:`#ecfdf5`,color:`#047857`},children:(0,D.jsx)(f,{size:22})}),(0,D.jsxs)(`div`,{className:`stat-card-info`,children:[(0,D.jsx)(`span`,{children:`Completed`}),(0,D.jsx)(`strong`,{children:Y.completed})]})]})]}),(0,D.jsxs)(`div`,{className:`orders-toolbar`,children:[(0,D.jsxs)(`div`,{className:`orders-search-wrapper`,children:[(0,D.jsx)(x,{size:18,className:`orders-search-icon`}),(0,D.jsx)(`input`,{type:`text`,className:`orders-search-input`,placeholder:`Search by order ID, customer name, or phone...`,value:A,onChange:e=>N(e.target.value)})]}),(0,D.jsxs)(`div`,{className:`orders-filters-wrapper`,children:[(0,D.jsx)(`span`,{style:{fontSize:`13px`,fontWeight:700,color:`#475569`,marginRight:`4px`},children:`Date Booked:`}),[`All`,`Today`,`Week`,`Month`,`Custom`].map(e=>(0,D.jsx)(`button`,{className:`date-preset-btn ${P===e?`active`:``}`,onClick:()=>F(e),children:e},e)),P===`Custom`&&(0,D.jsxs)(`div`,{className:`custom-date-container`,children:[(0,D.jsx)(r,{size:13,style:{color:`#64748b`}}),(0,D.jsx)(`input`,{type:`date`,className:`custom-date-input`,value:I,onChange:e=>R(e.target.value),title:`Start Date`}),(0,D.jsx)(`span`,{style:{fontSize:`12px`,color:`#94a3b8`,fontWeight:600},children:`to`}),(0,D.jsx)(`input`,{type:`date`,className:`custom-date-input`,value:V,onChange:e=>H(e.target.value),title:`End Date`})]})]})]}),(0,D.jsxs)(`div`,{className:`orders-card-table-wrap`,children:[(0,D.jsxs)(`table`,{className:`orders-modern-table`,children:[(0,D.jsx)(`thead`,{children:(0,D.jsxs)(`tr`,{children:[(0,D.jsx)(`th`,{children:`Order ID`}),(0,D.jsx)(`th`,{children:`Customer`}),(0,D.jsx)(`th`,{children:`Date Booked`}),(0,D.jsx)(`th`,{children:`Logistics Partner`}),(0,D.jsx)(`th`,{children:`Payment Status`}),(0,D.jsx)(`th`,{children:`Total Amount`}),(0,D.jsx)(`th`,{children:`Fulfillment`}),(0,D.jsx)(`th`,{style:{textAlign:`center`},children:`Actions`})]})}),(0,D.jsxs)(`tbody`,{children:[Z.map(e=>(0,D.jsxs)(`tr`,{children:[(0,D.jsxs)(`td`,{style:{fontWeight:700,color:`#1e293b`},children:[`#`,e.id,(0,D.jsx)(`div`,{style:{fontSize:`10px`,color:`#64748b`,fontWeight:400},children:e.invoiceNo})]}),(0,D.jsxs)(`td`,{children:[(0,D.jsx)(`div`,{style:{fontWeight:600,color:`#1e293b`},children:e.customer}),(0,D.jsxs)(`div`,{style:{fontSize:`11px`,color:`#64748b`},children:[e.customerType,` • `,e.phone]})]}),(0,D.jsx)(`td`,{style:{color:`#475569`,fontWeight:500},children:B(e.date)}),(0,D.jsx)(`td`,{children:(0,D.jsxs)(`div`,{style:{display:`flex`,alignItems:`center`,gap:`6px`,fontSize:`12px`,color:`#475569`},children:[(0,D.jsx)(p,{size:14,style:{color:`#6366f1`}}),(0,D.jsx)(`span`,{children:e.logistics||`Self Pickup`})]})}),(0,D.jsxs)(`td`,{children:[(0,D.jsx)(M,{paymentStatus:e.paymentStatus}),(0,D.jsx)(`div`,{style:{fontSize:`10px`,color:`#64748b`,marginTop:`4px`},children:e.payMethod})]}),(0,D.jsx)(`td`,{style:{fontWeight:700,color:`#0f172a`},children:k(e.total)}),(0,D.jsx)(`td`,{children:(0,D.jsx)(j,{status:e.status})}),(0,D.jsx)(`td`,{style:{padding:`16px 20px`,textAlign:`center`},children:(0,D.jsxs)(`div`,{style:{display:`flex`,gap:`6px`,justifyContent:`center`},children:[(0,D.jsxs)(`button`,{onClick:async()=>{try{let t=L(await w(e.id));t.customer=e.customer,t.customerType=e.customerType,t.phone=e.phone,t.email=e.email,t.shippingAddress=e.shippingAddress,t.logistics=e.logistics||t.logistics,t.trackingNo=e.trackingNo||t.trackingNo,W(t)}catch(e){alert(`Failed to load order details: ${e.message}`)}},style:{background:`#10b981`,color:`white`,border:`none`,borderRadius:`8px`,padding:`6px 12px`,fontSize:`12px`,fontWeight:600,cursor:`pointer`,display:`inline-flex`,alignItems:`center`,gap:`6px`,transition:`background 0.2s`},onMouseOver:e=>e.target.style.background=`#059669`,onMouseOut:e=>e.target.style.background=`#10b981`,children:[(0,D.jsx)(d,{size:14}),`Details`]}),(0,D.jsx)(`button`,{onClick:async()=>{if(window.confirm(`Are you sure you want to delete Order #${e.id}?`))try{await T(e.id),n(t=>t.filter(t=>t.id!==e.id))}catch(e){alert(`Error: ${e.message}`)}},title:`Delete Order`,style:{background:`#fee2e2`,color:`#ef4444`,border:`none`,borderRadius:`8px`,padding:`6px 10px`,fontSize:`12px`,cursor:`pointer`,display:`inline-flex`,alignItems:`center`,gap:`4px`},children:(0,D.jsx)(c,{size:14})})]})})]},e.id)),J.length===0&&(0,D.jsx)(`tr`,{children:(0,D.jsx)(`td`,{colSpan:`8`,style:{textAlign:`center`,padding:`32px`,color:`#64748b`},children:`No verified success orders found matching the filter criteria.`})})]})]}),J.length>0&&(0,D.jsx)(S,{currentPage:G,totalPages:X,onPageChange:K,totalItems:J.length,itemsPerPage:10})]}),U&&(0,D.jsx)(`div`,{className:`orders-modal-backdrop`,onClick:()=>W(null),children:(0,D.jsxs)(`div`,{className:`orders-modal-content`,onClick:e=>e.stopPropagation(),children:[(0,D.jsxs)(`div`,{className:`orders-modal-header`,children:[(0,D.jsxs)(`div`,{children:[(0,D.jsx)(`h2`,{children:`Order Details`}),(0,D.jsxs)(`span`,{style:{fontSize:`12px`,color:`#64748b`,fontWeight:500},children:[`Order #`,U.id,` • Invoice `,U.invoiceNo]})]}),(0,D.jsxs)(`div`,{style:{display:`flex`,gap:`8px`,alignItems:`center`},children:[(0,D.jsxs)(`button`,{onClick:()=>z(U),className:`catalog-btn catalog-btn--primary`,style:{padding:`6px 12px`,fontSize:`12px`,background:`#4f46e5`,display:`flex`,alignItems:`center`,gap:`6px`,border:`none`,color:`#fff`,borderRadius:`8px`,cursor:`pointer`},children:[(0,D.jsx)(s,{size:14}),` Print Invoice`]}),(0,D.jsx)(`button`,{className:`orders-modal-close-btn`,onClick:()=>W(null),children:(0,D.jsx)(g,{size:18})})]})]}),(0,D.jsxs)(`div`,{className:`orders-modal-body`,children:[(0,D.jsxs)(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`center`,background:`#f8fafc`,padding:`16px`,borderRadius:`12px`,marginBottom:`20px`,border:`1px solid #e2e8f0`},children:[(0,D.jsxs)(`div`,{children:[(0,D.jsx)(`span`,{style:{fontSize:`11px`,color:`#64748b`,textTransform:`uppercase`,fontWeight:600,display:`block`},children:`Fulfillment Status`}),(0,D.jsx)(`div`,{style:{marginTop:`4px`},children:(0,D.jsx)(j,{status:U.status})})]}),(0,D.jsxs)(`div`,{style:{textAlign:`right`},children:[(0,D.jsx)(`span`,{style:{fontSize:`11px`,color:`#64748b`,textTransform:`uppercase`,fontWeight:600,display:`block`},children:`Date Placed`}),(0,D.jsx)(`strong`,{style:{fontSize:`14px`,color:`#0f172a`,display:`block`,marginTop:`4px`},children:B(U.date)})]})]}),(0,D.jsxs)(`div`,{className:`detail-section-card`,children:[(0,D.jsx)(`h3`,{children:`Purchased Items`}),(0,D.jsx)(`div`,{style:{overflowX:`auto`},children:(0,D.jsxs)(`table`,{style:{width:`100%`,borderCollapse:`collapse`,fontSize:`13px`},children:[(0,D.jsx)(`thead`,{children:(0,D.jsxs)(`tr`,{style:{borderBottom:`1px solid #e2e8f0`,color:`#475569`,fontWeight:700},children:[(0,D.jsx)(`th`,{style:{padding:`8px 0`,textAlign:`left`},children:`Item Details`}),(0,D.jsx)(`th`,{style:{padding:`8px 8px`,textAlign:`center`},children:`Qty`}),(0,D.jsx)(`th`,{style:{padding:`8px 8px`,textAlign:`right`},children:`Unit Price`}),(0,D.jsx)(`th`,{style:{padding:`8px 0`,textAlign:`right`},children:`Total`})]})}),(0,D.jsx)(`tbody`,{children:U.items.map((e,t)=>(0,D.jsxs)(`tr`,{style:{borderBottom:`1px solid #f1f5f9`},children:[(0,D.jsxs)(`td`,{style:{padding:`10px 0`},children:[(0,D.jsx)(`div`,{style:{fontWeight:600},children:e.name}),(0,D.jsxs)(`div`,{style:{fontSize:`11px`,color:`#64748b`},children:[e.sku,` • `,e.category]})]}),(0,D.jsx)(`td`,{style:{padding:`10px 8px`,textAlign:`center`,fontWeight:600},children:e.qty}),(0,D.jsx)(`td`,{style:{padding:`10px 8px`,textAlign:`right`},children:k(e.price)}),(0,D.jsx)(`td`,{style:{padding:`10px 0`,textAlign:`right`,fontWeight:700},children:k(e.price*e.qty)})]},t))})]})})]}),(0,D.jsxs)(`div`,{style:{display:`grid`,gridTemplateColumns:`1fr 1fr`,gap:`16px`,marginBottom:`20px`},children:[(0,D.jsxs)(`div`,{className:`detail-section-card`,style:{marginBottom:0},children:[(0,D.jsx)(`h3`,{children:`Customer Profiles`}),(0,D.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`10px`},children:[(0,D.jsxs)(`div`,{style:{display:`flex`,gap:`8px`},children:[(0,D.jsx)(u,{size:15,style:{color:`#10b981`,marginTop:`2px`}}),(0,D.jsxs)(`div`,{children:[(0,D.jsx)(`strong`,{style:{fontSize:`13px`,display:`block`},children:U.customer}),(0,D.jsx)(`span`,{style:{fontSize:`11px`,color:`#64748b`},children:U.customerType})]})]}),(0,D.jsxs)(`div`,{style:{display:`flex`,gap:`8px`,fontSize:`12px`},children:[(0,D.jsx)(v,{size:14,style:{color:`#64748b`}}),(0,D.jsx)(`span`,{children:U.phone})]}),U.email&&(0,D.jsxs)(`div`,{style:{display:`flex`,gap:`8px`,fontSize:`12px`},children:[(0,D.jsx)(b,{size:14,style:{color:`#64748b`}}),(0,D.jsx)(`span`,{style:{wordBreak:`break-all`},children:U.email})]}),(0,D.jsxs)(`div`,{style:{display:`flex`,gap:`8px`,fontSize:`12px`,borderTop:`1px solid #f1f5f9`,paddingTop:`8px`},children:[(0,D.jsx)(y,{size:14,style:{color:`#ef4444`,flexShrink:0,marginTop:`2px`}}),(0,D.jsx)(`span`,{style:{color:`#475569`},children:U.shippingAddress||`No Address Provided`})]})]})]}),(0,D.jsxs)(`div`,{className:`detail-section-card`,style:{marginBottom:0},children:[(0,D.jsx)(`h3`,{children:`Logistics & Fulfillment`}),(0,D.jsxs)(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`10px`},children:[(0,D.jsxs)(`div`,{className:`detail-info-row`,style:{padding:0,borderBottom:`none`},children:[(0,D.jsx)(`span`,{className:`detail-info-label`,children:`Carrier:`}),(0,D.jsx)(`strong`,{className:`detail-info-value`,children:U.logistics||`Self Pickup`})]}),(0,D.jsxs)(`div`,{className:`detail-info-row`,style:{padding:0,borderBottom:`none`},children:[(0,D.jsx)(`span`,{className:`detail-info-label`,children:`Tracking No:`}),(0,D.jsx)(`strong`,{className:`detail-info-value`,style:{fontFamily:`monospace`},children:U.trackingNo||`—`})]}),U.isPacked&&(0,D.jsxs)(`div`,{style:{borderTop:`1px dashed #cbd5e1`,paddingTop:`8px`},children:[(0,D.jsx)(`span`,{style:{fontSize:`10px`,color:`#64748b`,fontWeight:600,display:`block`,textTransform:`uppercase`},children:`Packer Details`}),(0,D.jsxs)(`div`,{className:`tracking-user-profile`,style:{padding:`6px`,background:`#f0fdf4`,margin:`4px 0 0 0`},children:[U.packerImage?(0,D.jsx)(`img`,{className:`tracking-user-avatar`,src:U.packerImage,alt:U.packerName,style:{width:`28px`,height:`28px`}}):(0,D.jsx)(`div`,{className:`tracking-user-avatar`,style:{width:`28px`,height:`28px`,background:`#cbd5e1`,display:`flex`,alignItems:`center`,justifyCenter:`center`,fontSize:`10px`,fontWeight:700},children:U.packerName?.slice(0,2).toUpperCase()}),(0,D.jsxs)(`div`,{className:`tracking-user-details`,children:[(0,D.jsx)(`strong`,{style:{fontSize:`11px`},children:U.packerName}),(0,D.jsxs)(`span`,{style:{fontSize:`9px`},children:[`Packed `,U.packedDate||`TBD`]})]})]})]}),U.isShipped&&(0,D.jsxs)(`div`,{style:{borderTop:`1px dashed #cbd5e1`,paddingTop:`8px`},children:[(0,D.jsx)(`span`,{style:{fontSize:`10px`,color:`#64748b`,fontWeight:600,display:`block`,textTransform:`uppercase`},children:`Shipper Details`}),(0,D.jsx)(`div`,{className:`tracking-user-profile`,style:{padding:`6px`,background:`#e0e7ff`,margin:`4px 0 0 0`},children:(0,D.jsxs)(`div`,{className:`tracking-user-details`,style:{width:`100%`},children:[(0,D.jsxs)(`strong`,{style:{fontSize:`11px`,display:`flex`,justifyContent:`space-between`},children:[(0,D.jsx)(`span`,{children:U.shipperName}),(0,D.jsxs)(`span`,{style:{fontSize:`9px`,color:`#4f46e5`},children:[`Shipped `,U.shippedDate]})]}),U.packageImage&&(0,D.jsx)(`img`,{className:`tracking-package-img`,src:U.packageImage,alt:`Package`,style:{maxWidth:`80px`,marginTop:`4px`,maxHeight:`50px`}})]})})]})]})]})]}),(0,D.jsxs)(`div`,{className:`detail-section-card`,children:[(0,D.jsx)(`h3`,{children:`Billing & Payments`}),(0,D.jsxs)(`div`,{className:`detail-info-row`,children:[(0,D.jsx)(`span`,{className:`detail-info-label`,children:`Payment Method:`}),(0,D.jsx)(`span`,{className:`detail-info-value`,children:U.payMethod})]}),U.utr&&(0,D.jsxs)(`div`,{className:`detail-info-row`,children:[(0,D.jsx)(`span`,{className:`detail-info-label`,children:`UTR/Reference Code:`}),(0,D.jsx)(`span`,{className:`detail-info-value`,style:{fontFamily:`monospace`,background:`#f1f5f9`,padding:`2px 6px`,borderRadius:`4px`},children:U.utr})]}),(0,D.jsxs)(`div`,{className:`detail-info-row`,children:[(0,D.jsx)(`span`,{className:`detail-info-label`,children:`Subtotal:`}),(0,D.jsx)(`span`,{className:`detail-info-value`,children:k(U.subtotal)})]}),U.shippingFee>0&&(0,D.jsxs)(`div`,{className:`detail-info-row`,children:[(0,D.jsx)(`span`,{className:`detail-info-label`,children:`Shipping Fee:`}),(0,D.jsx)(`span`,{className:`detail-info-value`,children:k(U.shippingFee)})]}),U.gstAmount>0&&(0,D.jsxs)(`div`,{className:`detail-info-row`,children:[(0,D.jsx)(`span`,{className:`detail-info-label`,children:`GST:`}),(0,D.jsx)(`span`,{className:`detail-info-value`,children:k(U.gstAmount)})]}),U.discountAmount>0&&(0,D.jsxs)(`div`,{className:`detail-info-row`,children:[(0,D.jsx)(`span`,{className:`detail-info-label`,children:`Discount:`}),(0,D.jsxs)(`span`,{className:`detail-info-value`,style:{color:`#ef4444`},children:[`-`,k(U.discountAmount)]})]}),(0,D.jsxs)(`div`,{className:`detail-info-row`,children:[(0,D.jsx)(`span`,{className:`detail-info-label`,children:`Total Amount:`}),(0,D.jsx)(`span`,{className:`detail-info-value`,style:{color:`#059669`,fontWeight:700},children:k(U.total)})]}),(0,D.jsxs)(`div`,{className:`detail-info-row`,children:[(0,D.jsx)(`span`,{className:`detail-info-label`,children:`Paid Amount:`}),(0,D.jsx)(`span`,{className:`detail-info-value`,children:k(U.paid)})]}),(0,D.jsxs)(`div`,{className:`detail-info-row`,children:[(0,D.jsx)(`span`,{className:`detail-info-label`,children:`Balance Amount:`}),(0,D.jsx)(`span`,{className:`detail-info-value`,style:{color:U.total-U.paid>0?`#d97706`:`#059669`,fontWeight:700},children:k(U.total-U.paid)})]})]}),U.timeline&&(0,D.jsxs)(`div`,{className:`detail-section-card`,children:[(0,D.jsx)(`h3`,{children:`Fulfillment Tracker`}),(0,D.jsxs)(`div`,{className:`modern-timeline`,children:[(0,D.jsxs)(`div`,{className:`timeline-event completed`,children:[(0,D.jsx)(`span`,{className:`timeline-dot`}),(0,D.jsxs)(`div`,{className:`timeline-info`,children:[(0,D.jsx)(`span`,{className:`timeline-title`,children:`Order Created`}),(0,D.jsx)(`span`,{className:`timeline-time`,children:B(U.date)})]})]}),(0,D.jsxs)(`div`,{className:`timeline-event completed`,children:[(0,D.jsx)(`span`,{className:`timeline-dot`}),(0,D.jsxs)(`div`,{className:`timeline-info`,children:[(0,D.jsx)(`span`,{className:`timeline-title`,children:`Payment Verified`}),(0,D.jsx)(`span`,{className:`timeline-time`,children:`Verified Success`})]})]}),(0,D.jsxs)(`div`,{className:`timeline-event ${U.isPacked?`completed`:U.status===`Processing`?`active`:``}`,children:[(0,D.jsx)(`span`,{className:`timeline-dot`}),(0,D.jsxs)(`div`,{className:`timeline-info`,children:[(0,D.jsx)(`span`,{className:`timeline-title`,children:`Packed / Prepared`}),U.isPacked?(0,D.jsx)(D.Fragment,{children:(0,D.jsxs)(`span`,{className:`timeline-time`,children:[U.packedDate===`Verified`?`Automatically Verified`:`Packed on ${U.packedDate}`,` by `,U.packerName]})}):(0,D.jsx)(`span`,{className:`timeline-time`,children:`Pending Packaging`})]})]}),(0,D.jsxs)(`div`,{className:`timeline-event ${U.isShipped?`completed`:U.status===`Dispatched`?`active`:``}`,children:[(0,D.jsx)(`span`,{className:`timeline-dot`}),(0,D.jsxs)(`div`,{className:`timeline-info`,children:[(0,D.jsx)(`span`,{className:`timeline-title`,children:`Dispatched / Shipped`}),U.isShipped?(0,D.jsx)(D.Fragment,{children:(0,D.jsxs)(`span`,{className:`timeline-time`,children:[U.shippedDate===`Verified`?`Automatically Verified`:`Shipped on ${U.shippedDate}`,` via `,U.logistics||`Courier`,` `,U.shipperName===(U.logistics||`Courier`)?``:`by ${U.shipperName}`]})}):(0,D.jsx)(`span`,{className:`timeline-time`,children:`Pending Shipment Dispatch`})]})]}),(0,D.jsxs)(`div`,{className:`timeline-event ${U.status===`Completed`?`completed`:``}`,children:[(0,D.jsx)(`span`,{className:`timeline-dot`}),(0,D.jsxs)(`div`,{className:`timeline-info`,children:[(0,D.jsx)(`span`,{className:`timeline-title`,children:`Delivered & Closed`}),(0,D.jsx)(`span`,{className:`timeline-time`,children:U.status===`Completed`?`Fulfillment Successful`:`Awaiting Delivery Confirmation`})]})]})]})]})]})]})})]})};export{j as OrderStatusBadge,M as PaymentStatusBadge,V as default,k as formatCurrency,P as mapStatus,F as normalizePaymentMethod,N as parseAmount,A as statusMeta};
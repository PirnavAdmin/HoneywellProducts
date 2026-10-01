import{r as e}from"./rolldown-runtime-hePW80VL.js";import{n as t,t as n}from"./jsx-runtime-DE3RlOCf.js";import{t as r}from"./createLucideIcon-vmlAiHCP.js";import{t as i}from"./circle-check-big-BgXaPFLg.js";import{t as a}from"./clock-C8q545mg.js";import{t as o}from"./filter-B3wsn76Y.js";import{t as s}from"./plus-lqu1lAZl.js";import{t as c}from"./printer-BJtmNXey.js";import{t as l}from"./refresh-cw-Ox4s0ZJ7.js";import{t as u}from"./rotate-ccw-BNUiiM2S.js";import{t as d}from"./trash-2-CJ96Vptb.js";import{t as f}from"./trending-up-BNZNxffw.js";import{Ht as p,Xt as m,Zt as h,at as g,on as _,wt as v}from"./index-B0bbImdV.js";import{t as y}from"./Toast-CUwFOTNP.js";import{i as b}from"./ActionButtons-CdTFjRs2.js";import{a as x,i as S,n as C,r as w}from"./invoices-BRBpG-U6.js";var T=r(`Ban`,[[`circle`,{cx:`12`,cy:`12`,r:`10`,key:`1mglay`}],[`path`,{d:`m4.9 4.9 14.2 14.2`,key:`1m5liu`}]]),E=e(t(),1),D=n(),O=e=>{if(!e||typeof e!=`string`)return``;let t=e.trim().replace(/^#+/,``);for(;/^(INV-|ORD-|INV|ORD)/i.test(t);)t=t.replace(/^(INV-|ORD-)/i,``).replace(/^(INV|ORD)[-\s]*/i,``).trim();return t?`INV-${t}`:``},k=e=>{if(!e)return`-`;let t=new Date(e);return isNaN(t.getTime())?String(e):`${String(t.getDate()).padStart(2,`0`)} ${t.toLocaleString(`en-IN`,{month:`short`})} ${t.getFullYear()}`},A=e=>{if(typeof e==`number`)return`₹${e.toLocaleString(`en-IN`)}`;if(!e)return`₹0`;let t=String(e).trim().replace(/^(rs\.?|inr|₹)\s*/i,``).replace(/,/g,``);return`₹${(Number(t)||0).toLocaleString(`en-IN`)}`},j=e=>{if(!e)return`IN`;let t=e.trim().split(/\s+/);return t.length===1?t[0].slice(0,2).toUpperCase():(t[0][0]+t[t.length-1][0]).toUpperCase()},M=()=>{let[e,t]=(0,E.useState)([]),[n,r]=(0,E.useState)({totalRevenue:`Rs. 0`,paidInvoices:0,unpaidInvoices:0,cancelledInvoices:0}),[M,N]=(0,E.useState)(!0),[P,F]=(0,E.useState)(``),[I,L]=(0,E.useState)(null),[R,z]=(0,E.useState)(``),[B,V]=(0,E.useState)(`All`),[H,U]=(0,E.useState)(1);(0,E.useEffect)(()=>{U(1)},[R,B]);let W=(e,t=`success`)=>{L({message:e,type:t})},G=async(e=``,n=!1)=>{n||N(!0),F(``);try{let n=await S(e),i=(n.invoices||[]).map(e=>({...e,invoiceId:O(e.invoiceId)}));t(i),r({totalRevenue:n.totalRevenue||`Rs. 0`,paidInvoices:n.paidInvoices||0,unpaidInvoices:n.unpaidInvoices||0,cancelledInvoices:n.cancelledInvoices||0})}catch(e){n||(F(e.message||`Failed to fetch invoices.`),W(`Failed to load invoices data.`,`error`))}finally{n||N(!1)}};(0,E.useEffect)(()=>{G(``,!1)},[]),(0,E.useEffect)(()=>{let e=setTimeout(()=>{G(R,!0)},400);return()=>clearTimeout(e)},[R]);let K=async(e,t,n)=>{try{await x(e,{status:n}),W(`Invoice status updated to ${n}.`,`success`),G(R,!0)}catch(e){W(`Error updating status: ${e.message}`,`error`)}},q=async e=>{if(window.confirm(`Are you sure you want to cancel this invoice?`))try{await C(e),W(`Invoice marked as cancelled.`,`success`),G(R,!0)}catch(e){W(`Error cancelling invoice: ${e.message}`,`error`)}},J=async e=>{try{let t=await w(e),n=e=>{if(typeof e==`number`)return e;if(!e)return 0;let t=String(e).trim();return t=t.replace(/^(rs\.?|inr|₹)\s*/i,``),t=t.replace(/,/g,``),t=t.replace(/[^0-9.]/g,``),Number(t)||0},r=t.totalAmount===void 0?t.finalAmount===void 0?n(t.billed):Number(t.finalAmount):Number(t.totalAmount),i=Array.isArray(t.items)&&t.items.length>0?t.items:[],a=i.reduce((e,t)=>e+(t.priceNum===void 0?n(t.price):Number(t.priceNum))*Number(t.quantity||1),0),o=t.subTotal===void 0?t.subtotal===void 0?a>0?a:r/1.18:Number(t.subtotal):Number(t.subTotal),s=Number(t.discountAmount||t.discount||0),c=Number(t.shippingFee||t.shippingCharge||0),l=Math.max(0,o-s),u=t.taxAmount===void 0?t.gstAmount===void 0?l*.18:Number(t.gstAmount):Number(t.taxAmount),d=r>0?r:l+u+c,f=u/2,p=u/2,m=document.getElementById(`invoice-print-iframe`);m||(m=document.createElement(`iframe`),m.id=`invoice-print-iframe`,m.style.position=`fixed`,m.style.right=`0`,m.style.bottom=`0`,m.style.width=`0`,m.style.height=`0`,m.style.border=`0`,document.body.appendChild(m));let h=i.map((e,t)=>{let r=e.priceNum===void 0?n(e.price):Number(e.priceNum),i=Number(e.quantity||1),a=r*i,o=a*.18,s=a+o;return`
          <tr>
            <td style="text-align: center; font-weight: 600;">${t+1}</td>
            <td>
              <div style="font-weight: 700; color: #0f172a;">${e.productName||`Product`}</div>
              ${e.productCode?`<div style="font-size: 11px; color: #64748b;">SKU: ${e.productCode}</div>`:``}
            </td>
            <td style="text-align: center; font-weight: 600;">${i}</td>
            <td style="text-align: right;">₹${r.toLocaleString(`en-IN`,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
            <td style="text-align: right;">₹${o.toLocaleString(`en-IN`,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
            <td style="text-align: right; font-weight: 700;">₹${s.toLocaleString(`en-IN`,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
          </tr>
        `}).join(``),g=`TAX INVOICE`,_=(t.status||`Paid`).toLowerCase(),v=_===`paid`?`#10b981`:_===`cancelled`?`#ef4444`:`#f59e0b`,y=m.contentWindow||m,b=y.document;b.open(),b.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${g} - ${t.invoiceId}</title>
            <style>
              @page { size: A4 portrait; margin: 12mm; }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                color: #1e293b;
                margin: 0;
                padding: 0;
                font-size: 11.5px;
                line-height: 1.4;
              }
              .invoice-container { max-width: 800px; margin: 0 auto; }
              .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 2px solid #0f172a; margin-bottom: 16px; }
              .company-title { font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
              .company-subtitle { font-size: 10.5px; font-weight: 700; color: #1268a5; letter-spacing: 0.5px; margin-bottom: 4px; }
              .company-meta { font-size: 10px; color: #475569; line-height: 1.35; }
              .badge-tax-invoice { text-align: right; }
              .tax-title { font-size: 18px; font-weight: 800; color: #1268a5; letter-spacing: 1px; }
              .tax-subtitle { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-top: 2px; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
              .info-block { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; }
              .info-block-title { font-size: 11px; font-weight: 800; color: #0f172a; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 6px; }
              .info-row { display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 11px; }
              .info-label { color: #64748b; font-weight: 600; }
              .info-val { color: #0f172a; font-weight: 700; }
              .address-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px; }
              .address-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; }
              .address-card-title { font-size: 10.5px; font-weight: 800; text-transform: uppercase; color: #1268a5; margin-bottom: 6px; }
              .address-card p { margin: 0; font-size: 11px; line-height: 1.4; color: #334155; }
              .item-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
              .item-table th { background: #0f172a; color: #ffffff; font-weight: 700; font-size: 10.5px; text-transform: uppercase; padding: 8px 10px; border: 1px solid #0f172a; }
              .item-table td { padding: 8px 10px; border: 1px solid #e2e8f0; font-size: 11px; }
              .summary-flex { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
              .bank-box { flex: 1; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px 12px; font-size: 10.5px; }
              .bank-box-title { font-size: 10px; font-weight: 800; color: #166534; text-transform: uppercase; margin-bottom: 4px; }
              .bank-row { display: flex; margin-bottom: 2px; }
              .bank-label { width: 85px; color: #15803d; font-weight: 600; }
              .bank-val { font-weight: 700; color: #166534; }
              .financial-totals { width: 300px; font-size: 11.5px; }
              .total-line { display: flex; justify-content: space-between; padding: 4px 0; color: #475569; border-bottom: 1px solid #f1f5f9; }
              .grand-total-line { display: flex; justify-content: space-between; font-size: 14px; font-weight: 800; color: #0f172a; padding: 6px 0; border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; margin-top: 4px; }
              .invoice-footer { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 14px; border-top: 1px solid #e2e8f0; font-size: 10.5px; color: #64748b; }
              .signatory-box { text-align: center; width: 160px; }
              .signatory-line { height: 30px; border-bottom: 1px dashed #94a3b8; margin-bottom: 4px; }
            </style>
          </head>
          <body>
            <div class="invoice-container">
              <div class="invoice-header">
                <div style="display: flex; align-items: flex-start; gap: 14px;">
                  <img src="/honeywell-products-logo.png" style="height: 60px; width: auto; object-fit: contain;" alt="Honeywell Products" />
                  <div>
                    <div class="company-title">Honeywell</div>
                    <div class="company-subtitle">SECURITY & SURVEILLANCE SOLUTIONS</div>
                    <div class="company-meta">
                      101, Jain Sadguru Capital Park, Hitech City, Madhapur, Hyderabad - 500081<br/>
                      GSTIN: <strong>24DYYPP1677P1Z6</strong> | Phone: 040 4855 5758
                    </div>
                  </div>
                </div>
                <div class="badge-tax-invoice">
                  <div class="tax-title">${g}</div>
                  <div class="tax-subtitle">ORIGINAL FOR RECIPIENT</div>
                </div>
              </div>

              <div class="info-grid">
                <div class="info-block">
                  <div class="info-block-title">Invoice & Order Details</div>
                  <div class="info-row"><span class="info-label">Invoice No:</span><span class="info-val">${t.invoiceId}</span></div>
                  <div class="info-row"><span class="info-label">Invoice Date:</span><span class="info-val">${t.date||`Recent`}</span></div>
                  <div class="info-row"><span class="info-label">Order Ref ID:</span><span class="info-val">ORD-${t.id}</span></div>
                </div>
                <div class="info-block">
                  <div class="info-block-title">Payment & Settlement Status</div>
                  <div class="info-row"><span class="info-label">Payment Method:</span><span class="info-val">${t.paymentMethod||`UPI / Bank Transfer`}</span></div>
                  <div class="info-row"><span class="info-label">Payment Status:</span><span class="info-val" style="color: ${v}; font-weight: 800;">${_.toUpperCase()}</span></div>
                  <div class="info-row"><span class="info-label">Total Amount:</span><span class="info-val">₹${d.toLocaleString(`en-IN`,{minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>
                </div>
              </div>

              <div class="address-grid">
                <div class="address-card">
                  <div class="address-card-title">Billed To (Customer Details)</div>
                  <p>
                    <strong>${t.client}</strong><br/>
                    ${t.phone?`Phone: ${t.phone}<br/>`:``}
                    ${t.email&&!t.email.includes(`N/A`)?`Email: ${t.email.toLowerCase()}`:``}
                  </p>
                </div>
                <div class="address-card">
                  <div class="address-card-title">Delivery Location</div>
                  <p>
                    <strong>${t.client}</strong><br/>
                    ${(t.shippingAddress||t.address||`Standard Delivery Location`).replace(/\n/g,`<br/>`)}
                  </p>
                </div>
              </div>

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
                  ${h}
                </tbody>
              </table>

              <div class="summary-flex">
                <div class="bank-box">
                  <div class="bank-box-title">Remittance / Bank Account Details</div>
                  <div class="bank-row"><span class="bank-label">Bank Name:</span><span class="bank-val">State Bank of India</span></div>
                  <div class="bank-row"><span class="bank-label">Account Name:</span><span class="bank-val">Honeywell Products</span></div>
                  <div class="bank-row"><span class="bank-label">Account No:</span><span class="bank-val">50200012345678</span></div>
                  <div class="bank-row"><span class="bank-label">IFSC Code:</span><span class="bank-val">SBIN0001234</span></div>
                </div>

                <div class="financial-totals">
                  <div class="total-line"><span>Subtotal</span><span>₹${o.toLocaleString(`en-IN`,{minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>
                  <div class="total-line"><span>CGST (9%)</span><span>₹${f.toLocaleString(`en-IN`,{minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>
                  <div class="total-line"><span>SGST (9%)</span><span>₹${p.toLocaleString(`en-IN`,{minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>
                  <div class="grand-total-line">
                    <span>Grand Total Due</span>
                    <span>₹${d.toLocaleString(`en-IN`,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
                  </div>
                </div>
              </div>

              <div class="invoice-footer">
                <div style="flex-grow: 1; max-width: 65%;">
                  <strong>Terms & Notes:</strong><br/>
                  <span>Official computer-generated tax invoice. Valid for commercial warranty and tax credit.</span>
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
      `),b.close();try{b.title=`${g} - ${t.invoiceId}`}catch{}setTimeout(()=>{y.focus(),y.print()},300)}catch(e){W(`Failed to print invoice: ${e.message}`,`error`)}},Y=(0,E.useMemo)(()=>e.filter(e=>{let t=R.toLowerCase().trim(),n=!t||(e.invoiceId||``).toLowerCase().includes(t)||(e.client||``).toLowerCase().includes(t)||(e.email||``).toLowerCase().includes(t)||(e.billed||``).toLowerCase().includes(t)||(e.status||``).toLowerCase().includes(t),r=B===`All`?!0:B===`Paid`?(e.status||``).toLowerCase()===`paid`:B===`Unpaid`?(e.status||``).toLowerCase()===`unpaid`:(e.status||``).toLowerCase()===`cancelled`;return n&&r}),[e,R,B]),X=R!==``||B!==`All`,Z=()=>{z(``),V(`All`),U(1)},Q=(0,E.useMemo)(()=>{let e=(H-1)*10;return Y.slice(e,e+10)},[Y,H,10]);return(0,D.jsxs)(`div`,{className:`invoices-mgmt-container`,children:[I&&(0,D.jsx)(y,{message:I.message,type:I.type,onClose:()=>L(null)}),(0,D.jsxs)(`div`,{className:`invoices-header-card`,children:[(0,D.jsxs)(`div`,{className:`invoices-title-wrap`,children:[(0,D.jsx)(`div`,{className:`invoices-kicker`,children:`BILLING & FINANCIAL LEDGER`}),(0,D.jsx)(`h1`,{children:`Invoices Ledger`}),(0,D.jsx)(`p`,{children:`Generate, track, filter, and print customer tax invoices and commercial billing records`})]}),(0,D.jsxs)(`div`,{className:`invoices-header-actions`,children:[(0,D.jsxs)(`button`,{type:`button`,className:`btn-invoices-secondary`,onClick:()=>G(R,!1),disabled:M,title:`Refresh list`,children:[(0,D.jsx)(l,{size:15,className:M?`spin-icon`:``}),(0,D.jsx)(`span`,{children:`Refresh`})]}),(0,D.jsxs)(_,{to:`/admin/invoice/add`,className:`btn-invoices-primary`,children:[(0,D.jsx)(s,{size:16}),(0,D.jsx)(`span`,{children:`Create Invoice`})]})]})]}),P&&(0,D.jsxs)(`div`,{className:`invoices-error-banner`,children:[(0,D.jsx)(h,{size:18}),(0,D.jsx)(`span`,{children:P}),(0,D.jsx)(`button`,{type:`button`,onClick:()=>G(R,!1),className:`btn-retry`,children:`Retry`})]}),(0,D.jsxs)(`div`,{className:`invoices-stats-grid`,children:[(0,D.jsxs)(`div`,{className:`invoices-stat-card ${B===`All`?`stat-card-active`:``}`,onClick:()=>V(`All`),title:`Click to view all invoices`,children:[(0,D.jsxs)(`div`,{className:`stat-card-inner`,children:[(0,D.jsxs)(`div`,{className:`stat-card-text`,children:[(0,D.jsx)(`span`,{className:`stat-card-label`,children:`Total Revenue`}),(0,D.jsx)(`span`,{className:`stat-card-value`,children:A(n.totalRevenue)})]}),(0,D.jsx)(`div`,{className:`stat-card-icon icon-revenue`,children:(0,D.jsx)(f,{size:22})})]}),(0,D.jsx)(`div`,{className:`stat-card-footer`,children:(0,D.jsx)(`span`,{className:`stat-badge`,children:`All invoices`})})]}),(0,D.jsxs)(`div`,{className:`invoices-stat-card ${B===`Paid`?`stat-card-active`:``}`,onClick:()=>V(B===`Paid`?`All`:`Paid`),title:`Click to filter paid invoices`,children:[(0,D.jsxs)(`div`,{className:`stat-card-inner`,children:[(0,D.jsxs)(`div`,{className:`stat-card-text`,children:[(0,D.jsx)(`span`,{className:`stat-card-label`,children:`Paid Invoices`}),(0,D.jsx)(`span`,{className:`stat-card-value`,children:n.paidInvoices})]}),(0,D.jsx)(`div`,{className:`stat-card-icon icon-paid`,children:(0,D.jsx)(i,{size:22})})]}),(0,D.jsx)(`div`,{className:`stat-card-footer`,children:(0,D.jsx)(`span`,{className:`stat-badge badge-paid`,children:`Settled`})})]}),(0,D.jsxs)(`div`,{className:`invoices-stat-card ${B===`Unpaid`?`stat-card-active`:``}`,onClick:()=>V(B===`Unpaid`?`All`:`Unpaid`),title:`Click to filter unpaid invoices`,children:[(0,D.jsxs)(`div`,{className:`stat-card-inner`,children:[(0,D.jsxs)(`div`,{className:`stat-card-text`,children:[(0,D.jsx)(`span`,{className:`stat-card-label`,children:`Unpaid Invoices`}),(0,D.jsx)(`span`,{className:`stat-card-value`,children:n.unpaidInvoices})]}),(0,D.jsx)(`div`,{className:`stat-card-icon icon-unpaid`,children:(0,D.jsx)(a,{size:22})})]}),(0,D.jsx)(`div`,{className:`stat-card-footer`,children:(0,D.jsx)(`span`,{className:`stat-badge badge-unpaid`,children:`Pending payment`})})]}),(0,D.jsxs)(`div`,{className:`invoices-stat-card ${B===`Cancelled`?`stat-card-active`:``}`,onClick:()=>V(B===`Cancelled`?`All`:`Cancelled`),title:`Click to filter cancelled invoices`,children:[(0,D.jsxs)(`div`,{className:`stat-card-inner`,children:[(0,D.jsxs)(`div`,{className:`stat-card-text`,children:[(0,D.jsx)(`span`,{className:`stat-card-label`,children:`Cancelled`}),(0,D.jsx)(`span`,{className:`stat-card-value`,children:n.cancelledInvoices})]}),(0,D.jsx)(`div`,{className:`stat-card-icon icon-cancelled`,children:(0,D.jsx)(T,{size:22})})]}),(0,D.jsx)(`div`,{className:`stat-card-footer`,children:(0,D.jsx)(`span`,{className:`stat-badge badge-cancelled`,children:`Void / Refunded`})})]})]}),(0,D.jsxs)(`div`,{className:`invoices-toolbar-card`,children:[(0,D.jsxs)(`div`,{className:`invoices-search-box`,children:[(0,D.jsx)(v,{size:16,className:`search-icon`}),(0,D.jsx)(`input`,{type:`text`,placeholder:`Search by Invoice ID, client name, email, or amount...`,value:R,onChange:e=>z(e.target.value)}),R&&(0,D.jsx)(`button`,{type:`button`,className:`clear-search-btn`,onClick:()=>z(``),title:`Clear search`,children:(0,D.jsx)(g,{size:14})})]}),(0,D.jsxs)(`div`,{className:`invoices-filter-group`,children:[(0,D.jsxs)(`div`,{className:`select-wrapper`,children:[(0,D.jsx)(o,{size:14,className:`select-icon`}),(0,D.jsxs)(`select`,{value:B,onChange:e=>V(e.target.value),className:`invoice-select`,children:[(0,D.jsx)(`option`,{value:`All`,children:`All Statuses`}),(0,D.jsx)(`option`,{value:`Paid`,children:`Paid`}),(0,D.jsx)(`option`,{value:`Unpaid`,children:`Unpaid`}),(0,D.jsx)(`option`,{value:`Cancelled`,children:`Cancelled`})]})]}),X&&(0,D.jsxs)(`button`,{type:`button`,className:`btn-reset-filters`,onClick:Z,title:`Reset all active filters`,children:[(0,D.jsx)(u,{size:13}),(0,D.jsx)(`span`,{children:`Reset`})]}),(0,D.jsx)(`div`,{className:`invoices-count-tag`,children:(0,D.jsxs)(`span`,{children:[Y.length,` `,Y.length===1?`invoice`:`invoices`]})})]})]}),(0,D.jsxs)(`div`,{className:`invoices-table-card`,children:[M&&e.length===0?(0,D.jsxs)(`div`,{className:`invoices-loading-state`,children:[(0,D.jsx)(`div`,{className:`loading-spinner`}),(0,D.jsx)(`p`,{children:`Loading invoice records...`})]}):Y.length===0?(0,D.jsxs)(`div`,{className:`invoices-empty-state`,children:[(0,D.jsx)(`div`,{className:`empty-icon-wrap`,children:(0,D.jsx)(p,{size:36})}),(0,D.jsx)(`h3`,{children:`No invoices found`}),(0,D.jsx)(`p`,{children:X?`No invoice records matched your search filters.`:`No billing invoices have been generated yet.`}),X&&(0,D.jsxs)(`button`,{type:`button`,className:`btn-invoices-secondary`,onClick:Z,children:[(0,D.jsx)(u,{size:14}),` Clear Search Filters`]})]}):(0,D.jsx)(`div`,{className:`invoices-table-wrapper`,children:(0,D.jsxs)(`table`,{className:`invoices-table`,children:[(0,D.jsx)(`thead`,{children:(0,D.jsxs)(`tr`,{children:[(0,D.jsx)(`th`,{style:{width:`18%`},children:`INVOICE ID`}),(0,D.jsx)(`th`,{style:{width:`25%`},children:`CLIENT / BILLED TO`}),(0,D.jsx)(`th`,{style:{width:`14%`},children:`DATE`}),(0,D.jsx)(`th`,{style:{width:`16%`},children:`BILLED AMOUNT`}),(0,D.jsx)(`th`,{style:{width:`12%`},children:`STATUS`}),(0,D.jsx)(`th`,{style:{width:`15%`,textAlign:`center`},children:`ACTIONS`})]})}),(0,D.jsx)(`tbody`,{children:Q.map(e=>{let t=(e.status||`unpaid`).toLowerCase(),n=t===`paid`,r=t===`cancelled`,o=t.includes(`not applicable`)||t.includes(`n/a`)||t.includes(`not required`)||t===`na`,s=n?`Unpaid`:`Paid`,l=j(e.client);return(0,D.jsxs)(`tr`,{className:`invoice-table-row`,children:[(0,D.jsx)(`td`,{children:(0,D.jsxs)(`div`,{className:`invoice-id-cell`,children:[(0,D.jsx)(p,{size:14,className:`invoice-id-icon`}),(0,D.jsx)(`span`,{className:`invoice-id-text`,children:e.invoiceId||`INV-${e.id}`})]})}),(0,D.jsx)(`td`,{children:(0,D.jsxs)(`div`,{className:`customer-cell`,children:[(0,D.jsx)(`div`,{className:`customer-avatar`,title:e.client||`Client`,children:l}),(0,D.jsxs)(`div`,{className:`customer-meta`,children:[(0,D.jsx)(`span`,{className:`customer-name`,children:e.client||`General Customer`}),e.email&&(0,D.jsx)(`span`,{className:`contact-subtext`,children:e.email})]})]})}),(0,D.jsx)(`td`,{children:(0,D.jsx)(`div`,{className:`date-cell`,children:(0,D.jsx)(`span`,{className:`date-main`,children:e.date||k(e.createdAt)})})}),(0,D.jsx)(`td`,{children:(0,D.jsx)(`div`,{className:`amount-cell`,children:(0,D.jsx)(`strong`,{className:`amount-text`,children:A(e.billed||e.totalAmount||e.finalAmount)})})}),(0,D.jsx)(`td`,{children:(0,D.jsxs)(`span`,{className:`status-pill status-${n?`resolved`:r?`closed`:`pending`}`,children:[n?(0,D.jsx)(i,{size:12}):r?(0,D.jsx)(g,{size:12}):(0,D.jsx)(a,{size:12}),(0,D.jsx)(`span`,{children:e.status||`Unpaid`})]})}),(0,D.jsx)(`td`,{children:(0,D.jsxs)(`div`,{className:`table-actions-group`,children:[(0,D.jsx)(`button`,{type:`button`,onClick:()=>J(e.id),className:`action-icon-btn action-print`,title:`Print / View Tax Invoice PDF`,children:(0,D.jsx)(c,{size:15})}),!r&&!o&&(0,D.jsx)(`button`,{type:`button`,onClick:()=>K(e.id,e.status,s),className:`action-icon-btn ${n?`action-unpaid`:`action-paid`}`,title:`Mark as ${s}`,children:n?(0,D.jsx)(a,{size:15}):(0,D.jsx)(m,{size:15})}),!r&&(0,D.jsx)(`button`,{type:`button`,onClick:()=>q(e.id),className:`action-icon-btn action-delete`,title:`Cancel / Void Invoice`,children:(0,D.jsx)(d,{size:15})})]})})]},e.id)})})]})}),Y.length>0&&(0,D.jsx)(`div`,{className:`invoices-pagination-container`,children:(0,D.jsx)(b,{page:H,count:Y.length,itemsPerPage:10,onPageChange:U})})]})]})};export{M as default};
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Printer, Download, Search, ShoppingCart, CreditCard,
  Truck, ShieldCheck, CheckCircle2, HelpCircle, FileText, ExternalLink,
  ChevronRight, ArrowRight, UserCheck, PhoneCall, RefreshCw, Layers
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import './Documentation.css';

export default function Documentation() {
  useDocumentTitle('Customer User Guide | Honeywell Products', 'Step-by-step guide for using the Honeywell Products e-commerce platform.');
  const [activeSection, setActiveSection] = useState('intro');

  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        'intro', 'browsing', 'search-filters', 'product-details',
        'cart', 'checkout', 'account', 'payment', 'orders-tracking', 'support'
      ];
      const scrollY = window.scrollY + 140;

      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && el.offsetTop <= scrollY) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const navLinks = [
    { id: 'intro', label: '1. Platform Introduction' },
    { id: 'browsing', label: '2. Browsing Categories' },
    { id: 'search-filters', label: '3. Search & Smart Filters' },
    { id: 'product-details', label: '4. Product Details & Stock' },
    { id: 'cart', label: '5. Shopping Cart Management' },
    { id: 'checkout', label: '6. Checkout & Order Placement' },
    { id: 'account', label: '7. Customer Account & Login' },
    { id: 'payment', label: '8. Payment Methods' },
    { id: 'orders-tracking', label: '9. Order Status & Tracking' },
    { id: 'support', label: '10. FAQ & Warranty Support' },
  ];

  return (
    <div className="doc-wrapper">
      {/* Hero Banner */}
      <header className="doc-header-banner">
        <div className="container">
          <div className="doc-badge-pill">
            <BookOpen size={14} />
            <span>Customer User Guide</span>
          </div>
          <h1 className="doc-header-title">Honeywell Products Customer Guide</h1>
          <p className="doc-header-desc">
            Learn how to navigate our product catalogue, customize security solutions, purchase equipment online, and track shipments through our customer self-service portal.
          </p>

          <div className="doc-header-meta">
            <span><strong>Platform:</strong> Honeywell Products</span>
            <span><strong>Audience:</strong> Storefront Customers &amp; B2B Clients</span>
          </div>

          <div className="doc-actions-bar">
            <button onClick={handlePrint} className="doc-action-btn btn-white" title="Print this guide or save as PDF">
              <Printer size={16} />
              <span>Print / Save as PDF</span>
            </button>
            <a href="/docs/Honeywell-Products-Customer-User-Guide.html" target="_blank" rel="noopener noreferrer" className="doc-action-btn btn-outline" title="Open standalone HTML document">
              <ExternalLink size={16} />
              <span>Standalone HTML Version</span>
            </a>
            <Link to="/tech-doc" className="doc-action-btn btn-outline" title="View technical architecture documentation">
              <FileText size={16} />
              <span>Switch to Tech Doc</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="doc-main-container">
        {/* Sticky Table of Contents */}
        <aside className="doc-sidebar" aria-label="Table of contents">
          <h2 className="doc-sidebar-title">Table of Contents</h2>
          <ul className="doc-nav-list">
            {navLinks.map((item) => (
              <li key={item.id} className={`doc-nav-item ${activeSection === item.id ? 'active' : ''}`}>
                <a href={`#${item.id}`}>{item.label}</a>
              </li>
            ))}
          </ul>
        </aside>
        {/* Content Article */}
        <article className="doc-article-box">

                    {/* Formal Print-Only Executive Header */}
          <div className="doc-print-header">
            <div className="doc-print-header-top">
              <div className="doc-print-branding">
                <img src="/honeywell-logo.png" alt="Honeywell Products" className="doc-print-logo-img" />
                <div className="doc-print-tagline">SMART TECHNOLOGY • STRONGER PROTECTION</div>
              </div>
              <div className="doc-print-meta-card">
                <div className="doc-print-meta-item"><strong>Document:</strong> Customer User Guide</div>
                <div className="doc-print-meta-item"><strong>Platform:</strong> Honeywell Products</div>
              </div>
            </div>
            <div className="doc-print-divider"></div>
          </div>
          
          {/* SECTION 1 */}
          <section id="intro" className="doc-section">
            <div className="doc-section-header">
              <span className="doc-section-number">Topic 1</span>
              <h2 className="doc-section-heading">Introduction to the Honeywell Products Platform</h2>
            </div>
            <p className="doc-p">
              Welcome to the official <strong>Honeywell Products</strong> website. We deliver professional-grade security, video surveillance, and solar-powered monitoring systems for residential, commercial, industrial, and infrastructure deployments.
            </p>
            <p className="doc-p">
              The online platform enables individual customers, installers, system integrators, and corporate procurement teams to:
            </p>
            <ul style={{ paddingLeft: '24px', margin: '0 0 16px 0', color: '#475569' }}>
              <li>Browse comprehensive hardware specifications for CCTV cameras, NVRs, DVRs, solar panels, and networking equipment.</li>
              <li>Filter equipment by physical mounting environment, connection protocol, resolution, and artificial intelligence capabilities.</li>
              <li>Order products online with real-time tax calculation, instant order confirmation, and GST invoices.</li>
              <li>Track fulfillment milestones from warehouse packaging to final carrier delivery.</li>
              <li>Submit institutional bulk quote requests and warranty claims directly online.</li>
            </ul>

            <div className="doc-callout info">
              <HelpCircle size={20} />
              <div className="doc-callout-text">
                <h4>Catalogue Mode vs. E-Commerce Mode</h4>
                <p>
                  Honeywell Products operates with dynamic pricing visibility. When <strong>E-Commerce Mode</strong> is active, you can view transparent product pricing, add items to cart, and checkout online. When in <strong>Catalogue Mode</strong>, pricing is replaced with "Get a Quote" to accommodate custom institutional quotes.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 2 */}
          <section id="browsing" className="doc-section">
            <div className="doc-section-header">
              <span className="doc-section-number">Topic 2</span>
              <h2 className="doc-section-heading">How to Browse Products and Categories</h2>
            </div>
            <p className="doc-p">
              Discovering the right surveillance hardware is intuitive and flexible. You can navigate through multiple pathways:
            </p>

            <h3 className="doc-subheading">A. Header Mega Menu</h3>
            <p className="doc-p">
              Hover over the <strong>Products</strong> dropdown in the top navigation bar to explore organized equipment categories and subcategories, including:
            </p>
            <div className="doc-table-container">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Subcategories &amp; Hardware Types</th>
                    <th>Typical Use Cases</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Network Cameras</strong></td>
                    <td>IP Cameras, Bullet Cameras, Dome Cameras, Ultra Series</td>
                    <td>Office campuses, warehouses, high-resolution IP infrastructure</td>
                  </tr>
                  <tr>
                    <td><strong>Turbo HD Cameras</strong></td>
                    <td>Analog HD, ColorVu Series, Value Series</td>
                    <td>Cost-effective upgrades over existing coaxial cabling</td>
                  </tr>
                  <tr>
                    <td><strong>PTZ Cameras</strong></td>
                    <td>Speed Domes, Optical Zoom PTZ, Auto-Tracking</td>
                    <td>Perimeter surveillance, parking lots, open field coverage</td>
                  </tr>
                  <tr>
                    <td><strong>Solar Security</strong></td>
                    <td>Solar Panels, 4G Solar Kits, Off-Grid Batteries</td>
                    <td>Remote agricultural farms, construction sites, highways</td>
                  </tr>
                  <tr>
                    <td><strong>Recording Systems</strong></td>
                    <td>NVRs (Network Video Recorders), DVRs (Digital Video Recorders)</td>
                    <td>Centralized 24/7 video recording, multi-channel streams</td>
                  </tr>
                  <tr>
                    <td><strong>Storage &amp; Networking</strong></td>
                    <td>Surveillance HDDs, PoE Switches, Routers, Cables</td>
                    <td>Power-over-Ethernet network backbones, continuous data retention</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="doc-subheading">B. Solutions &amp; Industry Portfolios</h3>
            <p className="doc-p">
              If you have specific site security requirements, navigate to <Link to="/solutions" style={{ color: '#1268a5', fontWeight: 600 }}>Solutions</Link> or <Link to="/industries" style={{ color: '#1268a5', fontWeight: 600 }}>Industries</Link> to view recommended equipment blueprints tailored for Retail, Smart Homes, Manufacturing, Warehouses, Schools, and Hospitals.
            </p>
          </section>

          {/* SECTION 3 */}
          <section id="search-filters" className="doc-section">
            <div className="doc-section-header">
              <span className="doc-section-number">Topic 3</span>
              <h2 className="doc-section-heading">How to Search for Products and Use Smart Filters</h2>
            </div>
            <p className="doc-p">
              The products page (<Link to="/products" style={{ color: '#1268a5', fontWeight: 600 }}>/products</Link>) features a comprehensive search and multi-attribute filtering engine.
            </p>

            <ul className="doc-steps-list">
              <li className="doc-step-item">
                <h4>Keyword Search</h4>
                <p>
                  Use the search bar at the top of the catalogue or the search icon in the header. Type product names, SKU codes (e.g. <code>HM-CCTV-PTZ</code>), or technical specifications (e.g. <em>4MP</em>, <em>PoE</em>, <em>Solar</em>, <em>Night Vision</em>) to see immediate matching results.
                </p>
              </li>
              <li className="doc-step-item">
                <h4>Dynamic Filter Drawer</h4>
                <p>
                  Click the <strong>Filter Products</strong> button on the catalogue screen to open the facet panel. Filter by:
                </p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px', color: '#64748b' }}>
                  <li><strong>Category &amp; Subcategory:</strong> Narrow results to specific camera families or accessories.</li>
                  <li><strong>Installation Environment:</strong> Select <em>Indoor</em> or <em>Outdoor</em> (weather-rated).</li>
                  <li><strong>Connectivity:</strong> Filter by <em>PoE</em> (wired Ethernet), <em>Wi-Fi</em> (wireless), or <em>4G SIM</em> (cellular).</li>
                  <li><strong>Key Features:</strong> Filter by <em>Smart Night Vision</em>, <em>AI Human/Vehicle Detection</em>, or <em>IP67 Weatherproof</em>.</li>
                </ul>
              </li>
              <li className="doc-step-item">
                <h4>Sorting Options</h4>
                <p>
                  Sort results using the dropdown menu: <em>Featured</em>, <em>Price: Low to High</em>, <em>Price: High to Low</em>, or <em>Customer Rating</em>.
                </p>
              </li>
              <li className="doc-step-item">
                <h4>One-Click Reset</h4>
                <p>
                  Click <strong>Reset all</strong> at any time to clear all active filters and restore the full equipment catalogue.
                </p>
              </li>
            </ul>
          </section>

          {/* SECTION 4 */}
          <section id="product-details" className="doc-section">
            <div className="doc-section-header">
              <span className="doc-section-number">Topic 4</span>
              <h2 className="doc-section-heading">Viewing Product Details and Availability</h2>
            </div>
            <p className="doc-p">
              Clicking any product card opens the dedicated product details page (<code>/products/:id</code>) containing verified engineering and commercial data:
            </p>

            <div className="doc-table-container">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Detail Section</th>
                    <th>What You Can View &amp; Do</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>High-Res Image Gallery</strong></td>
                    <td>Interactive image viewer with thumbnail selection, multi-angle equipment views, and zoom capability.</td>
                  </tr>
                  <tr>
                    <td><strong>Pricing &amp; Discounts</strong></td>
                    <td>Clear display of Current Selling Price (₹), Maximum Retail Price (MRP), and calculated savings percentage.</td>
                  </tr>
                  <tr>
                    <td><strong>Stock Status</strong></td>
                    <td>Live inventory badge: <code>In Stock</code> (ready for immediate dispatch) or <code>Out of Stock</code>.</td>
                  </tr>
                  <tr>
                    <td><strong>Specification Tabs</strong></td>
                    <td>Structured technical tables detailing sensor specifications, lens focal length, IR range, power requirements, and enclosure ratings.</td>
                  </tr>
                  <tr>
                    <td><strong>Downloads</strong></td>
                    <td>Direct links to download the official <em>Product Datasheet (PDF)</em> and <em>Installation User Manual</em>.</td>
                  </tr>
                  <tr>
                    <td><strong>Verified Customer Reviews</strong></td>
                    <td>Real feedback and star ratings submitted by verified buyers and installer partners.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* SECTION 5 */}
          <section id="cart" className="doc-section">
            <div className="doc-section-header">
              <span className="doc-section-number">Topic 5</span>
              <h2 className="doc-section-heading">How to Add Products to the Cart and Update Quantities</h2>
            </div>
            <p className="doc-p">
              Purchasing equipment online is straightforward and responsive:
            </p>

            <ul className="doc-steps-list">
              <li className="doc-step-item">
                <h4>Adding an Item to Your Cart</h4>
                <p>
                  On any product card or detail page, select your desired quantity and click <strong>Add to Cart</strong>. A confirmation toast notification will appear, and the header cart badge will update immediately.
                </p>
              </li>
              <li className="doc-step-item">
                <h4>Quick "Buy Now"</h4>
                <p>
                  Clicking <strong>Buy Now</strong> adds the product directly to your cart and navigates straight to checkout in one seamless step.
                </p>
              </li>
              <li className="doc-step-item">
                <h4>Modifying Quantities in Cart</h4>
                <p>
                  Navigate to the <Link to="/cart" style={{ color: '#1268a5', fontWeight: 600 }}>Shopping Cart (/cart)</Link>. Use the <code>+</code> (plus) and <code>-</code> (minus) buttons next to each product to adjust quantities. The item subtotal, tax estimation, and overall order total recalculate instantly.
                </p>
              </li>
              <li className="doc-step-item">
                <h4>Removing Items</h4>
                <p>
                  Click the trash/delete icon on any item row to remove it from your cart. Your cart is persisted locally in your browser, so items remain saved if you close and reopen your browser tab.
                </p>
              </li>
            </ul>
          </section>

          {/* SECTION 6 */}
          <section id="checkout" className="doc-section">
            <div className="doc-section-header">
              <span className="doc-section-number">Topic 6</span>
              <h2 className="doc-section-heading">How to Proceed Through Checkout and Place an Order</h2>
            </div>
            <p className="doc-p">
              The checkout page (<Link to="/checkout" style={{ color: '#1268a5', fontWeight: 600 }}>/checkout</Link>) provides a streamlined, single-page order completion process:
            </p>

            <ul className="doc-steps-list">
              <li className="doc-step-item">
                <h4>Customer Contact Information</h4>
                <p>
                  Enter your Full Name, 10-digit Mobile Number, and Email Address. If you are signed into your customer account, these fields auto-fill automatically.
                </p>
              </li>
              <li className="doc-step-item">
                <h4>Shipping Address</h4>
                <p>
                  Provide the delivery Street Address, City, State, and 6-digit PIN code. Registered customers can select from saved addresses with one click.
                </p>
              </li>
              <li className="doc-step-item">
                <h4>Order Summary &amp; Taxes</h4>
                <p>
                  Review the items being purchased, unit pricing, GST tax breakdown, and final amount payable.
                </p>
              </li>
              <li className="doc-step-item">
                <h4>Select Payment Option</h4>
                <p>
                  Choose your payment method (UPI, Card, Net Banking, QR, Direct Bank Transfer, or Cash on Delivery). Complete the verification flow described in Topic 8 below.
                </p>
              </li>
              <li className="doc-step-item">
                <h4>Confirmation &amp; Order ID</h4>
                <p>
                  Upon successful submission, you will be redirected to the <strong>Order Success</strong> page (<code>/order-success</code>) displaying your unique Order ID (e.g. <code>#ORD-1793014790119</code>), booked date, order summary, and next fulfillment steps.
                </p>
              </li>
            </ul>
          </section>

          {/* SECTION 7 */}
          <section id="account" className="doc-section">
            <div className="doc-section-header">
              <span className="doc-section-number">Topic 7</span>
              <h2 className="doc-section-heading">Customer Registration, Login &amp; Account Management</h2>
            </div>
            <p className="doc-p">
              Managing your profile, orders, and addresses is unified within the Customer Portal (<Link to="/account" style={{ color: '#1268a5', fontWeight: 600 }}>/account</Link>):
            </p>

            <div className="doc-table-container">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>How It Works</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>New Customer Registration</strong></td>
                    <td>Create an account by providing your Name, Email, Mobile number, and a secure password.</td>
                  </tr>
                  <tr>
                    <td><strong>Secure Customer Login</strong></td>
                    <td>Sign in using your Email and Password. A secure session token is stored in your browser to keep you logged in.</td>
                  </tr>
                  <tr>
                    <td><strong>Profile Management</strong></td>
                    <td>Update personal contact details, phone number, and commercial organization name.</td>
                  </tr>
                  <tr>
                    <td><strong>Address Book</strong></td>
                    <td>Save multiple shipping addresses (Home, Office, Warehouse). Mark your primary shipping destination for fast checkout.</td>
                  </tr>
                  <tr>
                    <td><strong>Bank Details for Refunds</strong></td>
                    <td>Save bank account and IFSC details securely to expedite warranty reimbursements or refund credits.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* SECTION 8 */}
          <section id="payment" className="doc-section">
            <div className="doc-section-header">
              <span className="doc-section-number">Topic 8</span>
              <h2 className="doc-section-heading">How Payment Works on Honeywell Products</h2>
            </div>
            <p className="doc-p">
              Our checkout supports multiple convenient payment channels tailored for Indian customers and commercial buyers:
            </p>

            <div className="doc-table-container">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Payment Method</th>
                    <th>Process &amp; Flow</th>
                    <th>Status Behavior</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>UPI (VPA)</strong></td>
                    <td>Enter your Virtual Payment Address (e.g. <code>user@okhdfcbank</code>) and approve the payment prompt.</td>
                    <td>Instant verification; order moves immediately to <code>Processing</code>.</td>
                  </tr>
                  <tr>
                    <td><strong>Dynamic UPI QR Code</strong></td>
                    <td>A live QR code appears on-screen with an active countdown timer. Scan with Google Pay, PhonePe, Paytm, or BHIM. The page polls the status and confirms your order automatically.</td>
                    <td>Instant verification on transaction success.</td>
                  </tr>
                  <tr>
                    <td><strong>Credit &amp; Debit Cards</strong></td>
                    <td>Enter 16-digit Card Number, Expiry Date, CVV, and Name on Card. Simulated 3D-Secure OTP verification confirms the transaction.</td>
                    <td>Instant verification.</td>
                  </tr>
                  <tr>
                    <td><strong>Net Banking</strong></td>
                    <td>Select from major banks (HDFC Bank, State Bank of India, ICICI Bank, Axis Bank, Kotak Mahindra) and authenticate via simulated netbanking OTP.</td>
                    <td>Instant verification.</td>
                  </tr>
                  <tr>
                    <td><strong>Direct Bank Transfer / NEFT / IMPS</strong></td>
                    <td>View Honeywell Products corporate bank account details (HDFC Bank, Account Number, IFSC code). Submit your payment reference / UTR number for manual verification.</td>
                    <td>Order is placed in <code>Pending Verification</code> until our finance team reviews the bank credit and approves it.</td>
                  </tr>
                  <tr>
                    <td><strong>Cash on Delivery (COD)</strong></td>
                    <td>Available on eligible orders. Pay cash or UPI upon delivery by the carrier.</td>
                    <td>Order booked with payment due on delivery.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="doc-callout tip">
              <CheckCircle2 size={20} />
              <div className="doc-callout-text">
                <h4>Payment Security Notice</h4>
                <p>
                  Honeywell Products never stores raw credit card CVV codes or bank passwords. All API calls utilize HTTPS encryption and secure JWT session credentials.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 9 */}
          <section id="orders-tracking" className="doc-section">
            <div className="doc-section-header">
              <span className="doc-section-number">Topic 9</span>
              <h2 className="doc-section-heading">Viewing Orders, Order Status &amp; Live Tracking</h2>
            </div>
            <p className="doc-p">
              Customers have multiple self-service options to monitor their purchases:
            </p>

            <h3 className="doc-subheading">A. Order History in Customer Portal</h3>
            <p className="doc-p">
              Visit <Link to="/account/orders" style={{ color: '#1268a5', fontWeight: 600 }}>My Orders (/account/orders)</Link> to view a ledger of all your current and past orders:
            </p>
            <ul style={{ paddingLeft: '24px', margin: '0 0 16px 0', color: '#475569' }}>
              <li><strong>Order ID:</strong> E.g. <code>#ORD-1793014790119</code>.</li>
              <li><strong>Date Booked:</strong> Timestamp of order placement.</li>
              <li><strong>Fulfillment Statuses:</strong> <code>Pending Verification</code> &rarr; <code>Processing</code> &rarr; <code>Dispatched</code> &rarr; <code>In Transit</code> &rarr; <code>Delivered</code> (or <code>Cancelled</code>).</li>
              <li><strong>Action Buttons:</strong> Click <strong>View Details</strong> to see complete items, delivery addresses, and logistics details.</li>
            </ul>

            <h3 className="doc-subheading">B. Public Live Order Tracking</h3>
            <p className="doc-p">
              You can track an order anytime without logging in at <Link to="/order-tracking" style={{ color: '#1268a5', fontWeight: 600 }}>Order Tracking (/order-tracking)</Link>:
            </p>
            <ol style={{ paddingLeft: '24px', margin: '0 0 16px 0', color: '#475569' }}>
              <li>Enter your Order ID (e.g. <code>#1001</code> or <code>#ORD-1793014790119</code>).</li>
              <li>Enter the registered Email or 10-digit Mobile number used during checkout.</li>
              <li>View the live milestone progress bar, carrier name (e.g. Delhivery, Blue Dart, Self Pickup), tracking AWB number, and latest dispatch logs.</li>
            </ol>

            <h3 className="doc-subheading">C. Tax Invoices</h3>
            <p className="doc-p">
              Official GST tax invoices can be viewed and printed directly from your order details screen. Click <strong>Download Invoice</strong> to generate a printable PDF invoice with complete itemized tax breakdowns.
            </p>
          </section>

          {/* SECTION 10 */}
          <section id="support" className="doc-section">
            <div className="doc-section-header">
              <span className="doc-section-number">Topic 10</span>
              <h2 className="doc-section-heading">Common Inquiries, Bulk Quotes &amp; Warranty Support</h2>
            </div>
            <p className="doc-p">
              Practical guidance for everyday customer scenarios:
            </p>

            <div className="doc-table-container">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Scenario</th>
                    <th>Resolution &amp; Next Steps</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Institutional / Bulk Quotes</strong></td>
                    <td>
                      Need institutional pricing for 10+ cameras or commercial projects? Click <strong>Get a Quote</strong> in the top header or submit a request at <Link to="/contact" style={{ color: '#1268a5', fontWeight: 600 }}>Contact Us</Link>. Our enterprise sales team will reply with a customized quotation.
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Warranty Claims &amp; Service</strong></td>
                    <td>
                      Products carry manufacturer warranty protection. If equipment requires inspection or replacement, submit a claim at <Link to="/warranty" style={{ color: '#1268a5', fontWeight: 600 }}>Warranty</Link> or <Link to="/service-request" style={{ color: '#1268a5', fontWeight: 600 }}>Service Request</Link> with your product serial number, invoice reference, and defect description.
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Downloading Firmware &amp; Software</strong></td>
                    <td>
                      Access official client surveillance software, mobile apps, and device firmware at <Link to="/downloads" style={{ color: '#1268a5', fontWeight: 600 }}>Downloads Center</Link> and <Link to="/resources/software" style={{ color: '#1268a5', fontWeight: 600 }}>Software Downloads</Link>.
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Contacting Support Directly</strong></td>
                    <td>
                      Reach our support team via telephone helpline (<code>+91 040 4855 5758</code>), email (<code>info@honeywellproducts.com</code>), or visit our corporate campus at <em>101, Jain Sadguru Capital Park, Hitech City, Madhapur, Hyderabad - 500081, Telangana</em>.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="doc-callout info">
              <PhoneCall size={20} />
              <div className="doc-callout-text">
                <h4>Need Immediate Assistance?</h4>
                <p>
                  Visit our public <Link to="/contact" style={{ color: '#1268a5', fontWeight: 700 }}>Contact Us</Link> page to send a direct message to our sales, engineering, or warranty teams.
                </p>
              </div>
            </div>
          </section>

        </article>
      </div>
    </div>
  );
}
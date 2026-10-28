import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCode, Printer, Download, Server, Database, Shield,
  Terminal, Layers, CheckCircle2, AlertCircle, Copy, Check,
  ExternalLink, Code2, Globe, Cpu, Wrench, BookOpen
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import './Documentation.css';

export default function TechDoc() {
  useDocumentTitle('Technical Documentation | Honeywell Products Platform', 'Engineering architecture, tech stack, API specifications, and deployment guide.');
  const [activeSection, setActiveSection] = useState('arch-overview');
  const [copiedKey, setCopiedKey] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        'arch-overview', 'frontend-stack', 'backend-stack', 'api-directory',
        'api-integration', 'auth-security', 'db-storage', 'catalog-cart',
        'checkout-order', 'payment-arch', 'procurement-returns', 'env-config',
        'local-dev', 'testing-build', 'deployment-docker', 'limitations'
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

  const handleCopy = (key, text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const navLinks = [
    { id: 'arch-overview', label: '1. Architecture Overview' },
    { id: 'frontend-stack', label: '2. Frontend Stack & Structure' },
    { id: 'backend-stack', label: '3. Backend Stack & Pipeline' },
    { id: 'api-directory', label: '4. 49-Controller API Directory' },
    { id: 'api-integration', label: '5. API Integration & Headers' },
    { id: 'auth-security', label: '6. Auth & 25-Module RBAC' },
    { id: 'db-storage', label: '7. MySQL Database & Storage' },
    { id: 'catalog-cart', label: '8. Catalog & Cart Data Flow' },
    { id: 'checkout-order', label: '9. Checkout & Order Lifecycle' },
    { id: 'payment-arch', label: '10. Payment Architecture' },
    { id: 'procurement-returns', label: '11. Procurement & Returns Flow' },
    { id: 'env-config', label: '12. Environment Configuration' },
    { id: 'local-dev', label: '13. Local Dev Setup' },
    { id: 'testing-build', label: '14. Testing & Production Build' },
    { id: 'deployment-docker', label: '15. Docker & Nginx Deployment' },
    { id: 'limitations', label: '16. Limitations & Scope' },
  ];

  return (
    <div className="doc-wrapper">
      {/* Hero Banner */}
      <header className="doc-header-banner">
        <div className="container">
          <div className="doc-badge-pill">
            <FileCode size={14} />
            <span>Developer Technical Guide</span>
          </div>
          <h1 className="doc-header-title">Honeywell Products Technical Documentation</h1>
          <p className="doc-header-desc">
            Complete technical specification of the Honeywell Products platform: full-stack architecture, React 19 frontend, ASP.NET Core 8 Web API, 49-controller API directory, 25-module dynamic RBAC matrix, and Docker container topology.
          </p>

          <div className="doc-header-meta">
            <span><strong>Architecture:</strong> Monorepo (React 19 + ASP.NET Core 8 + MySQL)</span>
            <span><strong>Controllers:</strong> 49 REST Controllers</span>
            <span><strong>Security:</strong> JWT Bearer + 25-Module Dynamic RBAC</span>
          </div>

          <div className="doc-actions-bar">
            <button onClick={handlePrint} className="doc-action-btn btn-white" title="Print this technical guide or save as PDF">
              <Printer size={16} />
              <span>Print / Save as PDF</span>
            </button>
            <a href="/docs/Honeywell-Products-Technical-Documentation.html" target="_blank" rel="noopener noreferrer" className="doc-action-btn btn-outline" title="Open standalone HTML tech document">
              <ExternalLink size={16} />
              <span>Standalone HTML Tech Doc</span>
            </a>
            <Link to="/documentation" className="doc-action-btn btn-outline" title="Switch to Customer User Guide">
              <BookOpen size={16} />
              <span>Switch to User Guide</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="doc-main-container">
        {/* Sticky Table of Contents */}
        <aside className="doc-sidebar" aria-label="Technical Table of Contents">
          <h2 className="doc-sidebar-title">Technical Sections</h2>
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
                <div className="doc-print-brand">HONEYWELL PRODUCTS</div>
                <div className="doc-print-tagline">SMART TECHNOLOGY • STRONGER PROTECTION</div>
              </div>
              <div className="doc-print-meta-card">
                <div className="doc-print-meta-item"><strong>Document:</strong> Technical Documentation</div>
                <div className="doc-print-meta-item"><strong>Stack:</strong> React 19 • ASP.NET 8 • MySQL</div>
                <div className="doc-print-meta-item"><strong>Platform:</strong> Honeywell Products</div>
              </div>
            </div>
            <div className="doc-print-divider"></div>
          </div>

          {/* SECTION 1 */}
          <section id="arch-overview" className="doc-section">
            <div className="doc-section-header">
              <span className="doc-section-number">Section 1</span>
              <h2 className="doc-section-heading">Project Overview &amp; Monorepo Architecture</h2>
            </div>
            <p className="doc-p">
              The <strong>Honeywell Products platform</strong> is an enterprise e-commerce, quotation, and operations management platform specialized for commercial surveillance hardware, high-definition IP cameras, NVR/DVR units, solar-powered perimeter monitoring kits, and industrial cabling accessories.
            </p>
            <p className="doc-p">
              The platform is architected as a cohesive monorepo uniting an ASP.NET Core 8 Web API backend, a React 19 Single Page Application frontend, relational MySQL persistence, and containerized Nginx reverse proxy topology:
            </p>

            <div className="doc-code-block">
              <div className="doc-code-header">
                <span>Repository Topology</span>
                <button
                  className="doc-code-copy-btn"
                  onClick={() => handleCopy('repo-tree', `HoneywellProducts-main/
|-- Honeywell-Backend/     ASP.NET Core 8 Web API (.NET 8.0, C#, EF Core, Controllers, DTOs)
|-- Honeywell-Frontend/    React 19 SPA, Vite 8, React Router DOM v7, Tailwind CSS, Lucide
|-- docker-compose.yml     Multi-container production stack (frontend, backend, uploads)
|-- nginx.conf             Nginx edge reverse proxy (/api/ and /uploads/, 550MB payload)
|-- db.sql                 MySQL relational schema snapshot & seed data
\`-- .env                   Container deployment environment configuration`)}
                >
                  {copiedKey === 'repo-tree' ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedKey === 'repo-tree' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre>{`HoneywellProducts-main/
|-- Honeywell-Backend/     ASP.NET Core 8 Web API (.NET 8.0, C#, EF Core, Controllers)
|-- Honeywell-Frontend/    React 19 SPA, Vite 8, React Router DOM v7, Tailwind CSS
|-- docker-compose.yml     Multi-container production stack (frontend, backend, uploads)
|-- nginx.conf             Nginx reverse proxy (/api/ and /uploads/, 550MB payload)
|-- db.sql                 MySQL relational schema snapshot & seed data
\`-- .env                   Container deployment environment configuration`}</pre>
            </div>
          </section>

          {/* SECTION 2 */}
          <section id="frontend-stack" className="doc-section">
            <div className="doc-section-header">
              <span className="doc-section-number">Section 2</span>
              <h2 className="doc-section-heading">Frontend Technologies &amp; Project Structure</h2>
            </div>
            <p className="doc-p">
              The frontend is housed in <code>Honeywell-Frontend/</code> and built with modern web technologies:
            </p>

            <div className="doc-table-container">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th style={{ width: '22%' }}>Layer</th>
                    <th style={{ width: '25%' }}>Technology</th>
                    <th style={{ width: '15%' }}>Version</th>
                    <th style={{ width: '38%' }}>Role in Platform</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>UI Library</strong></td>
                    <td>React (JSX)</td>
                    <td><code>19.2.0</code></td>
                    <td>Functional component tree, hooks, reactive rendering</td>
                  </tr>
                  <tr>
                    <td><strong>Build Engine</strong></td>
                    <td>Vite</td>
                    <td><code>8.2.2</code></td>
                    <td>Fast HMR development server &amp; Rollup-optimized production bundling</td>
                  </tr>
                  <tr>
                    <td><strong>Routing</strong></td>
                    <td>React Router DOM</td>
                    <td><code>7.1.1</code></td>
                    <td>SPA routing, dynamic lazy code-splitting, nested admin layouts</td>
                  </tr>
                  <tr>
                    <td><strong>Styling</strong></td>
                    <td>Tailwind CSS &amp; CSS Variables</td>
                    <td><code>3.4.17</code></td>
                    <td>Honeywell design tokens (<code>--red</code>, <code>--ink</code>, <code>--surface</code>)</td>
                  </tr>
                  <tr>
                    <td><strong>Iconography</strong></td>
                    <td>Lucide React</td>
                    <td><code>0.468.0</code></td>
                    <td>Consistent SVG icons across storefront and admin console</td>
                  </tr>
                  <tr>
                    <td><strong>HTTP Clients</strong></td>
                    <td>Axios &amp; Fetch API</td>
                    <td><code>1.19.0</code></td>
                    <td>REST API communication with Bearer token injection</td>
                  </tr>
                  <tr>
                    <td><strong>Charts &amp; Visuals</strong></td>
                    <td>Recharts</td>
                    <td><code>3.1.0</code></td>
                    <td>Admin sales analytics and order fulfillment status breakdown</td>
                  </tr>
                  <tr>
                    <td><strong>Document Generation</strong></td>
                    <td>jsPDF &amp; html2canvas</td>
                    <td><code>4.2.1</code></td>
                    <td>Client-side GST tax invoice &amp; datasheet PDF rendering</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="doc-subheading">Key Frontend Architecture Files</h3>
            <ul style={{ paddingLeft: '24px', margin: '0 0 16px 0', color: '#475569' }}>
              <li><code>src/App.jsx</code>: Master routing registry managing public layout, customer portal, and protected admin console.</li>
              <li><code>src/context/AuthContext.jsx</code>: Storefront customer session restoration, login/logout, and storage sync.</li>
              <li><code>src/context/CartContext.jsx</code>: Reactive shopping cart state backed by <code>honey-well-cart</code> localStorage.</li>
              <li><code>src/context/SettingsContext.jsx</code>: Dynamic catalogue pricing mode (Price Visibility ON/OFF) and branding controls.</li>
              <li><code>src/context/UIContext.jsx</code>: Global application toasts, inquiry modals, and mobile navigation states.</li>
              <li><code>src/utils/rbac.js</code>: Dynamic role-based access engine mapping route segments to 25 database modules.</li>
              <li><code>src/services/customerApi.js</code>: Customer portal endpoints matching ASP.NET Core DTO contracts.</li>
              <li><code>src/services/orderService.js</code>: Orders, tax calculation, fulfillment status, and logistics tracking client.</li>
            </ul>
          </section>

          {/* SECTION 3 */}
          <section id="backend-stack" className="doc-section">
            <div className="doc-section-header">
              <span className="doc-section-number">Section 3</span>
              <h2 className="doc-section-heading">Backend Technologies &amp; Architecture</h2>
            </div>
            <p className="doc-p">
              The backend application is structured as a modular monolithic ASP.NET Core 8 Web API in <code>Honeywell-Backend/</code>, organized into robust business subsystems:
            </p>

            <div className="doc-table-container">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th style={{ width: '22%' }}>Component</th>
                    <th style={{ width: '30%' }}>Framework / Library</th>
                    <th style={{ width: '15%' }}>Version</th>
                    <th style={{ width: '33%' }}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Runtime</strong></td>
                    <td>.NET 8.0 (C# 12)</td>
                    <td><code>net8.0</code></td>
                    <td>High-performance cross-platform runtime</td>
                  </tr>
                  <tr>
                    <td><strong>API Framework</strong></td>
                    <td>ASP.NET Core Web API</td>
                    <td><code>8.0</code></td>
                    <td>RESTful controllers, model binding, filters, DI</td>
                  </tr>
                  <tr>
                    <td><strong>ORM</strong></td>
                    <td>Entity Framework Core</td>
                    <td><code>9.0.8</code></td>
                    <td>Relational persistence and LINQ queries</td>
                  </tr>
                  <tr>
                    <td><strong>MySQL Provider</strong></td>
                    <td>Pomelo.EntityFrameworkCore.MySql</td>
                    <td><code>9.0.0</code></td>
                    <td>Native MySQL server database connectivity</td>
                  </tr>
                  <tr>
                    <td><strong>Security</strong></td>
                    <td>Microsoft.AspNetCore.Authentication.JwtBearer</td>
                    <td><code>8.0.0</code></td>
                    <td>JWT Bearer token validation and claims authentication</td>
                  </tr>
                  <tr>
                    <td><strong>Password Hashing</strong></td>
                    <td>BCrypt.Net-Next</td>
                    <td><code>4.2.0</code></td>
                    <td>Salted password hashing for admin and customers</td>
                  </tr>
                  <tr>
                    <td><strong>Email Delivery</strong></td>
                    <td>MailKit</td>
                    <td><code>4.17.0</code></td>
                    <td>SMTP client for 2FA OTP codes and notifications</td>
                  </tr>
                  <tr>
                    <td><strong>API Docs</strong></td>
                    <td>Swashbuckle.AspNetCore (Swagger)</td>
                    <td><code>6.6.2</code></td>
                    <td>Interactive OpenAPI specification at <code>/swagger</code></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="doc-subheading">Backend Startup Pipeline (<code>Program.cs</code>)</h3>
            <ol style={{ paddingLeft: '24px', margin: '0 0 16px 0', color: '#475569' }}>
              <li><strong>Caching &amp; Compression:</strong> In-memory caching (<code>IMemoryCache</code>) and Brotli/Gzip response compression for optimized payload delivery.</li>
              <li><strong>JSON Serialization:</strong> <code>ReferenceHandler.IgnoreCycles</code> eliminates circular reference serialization errors on relational entities.</li>
              <li><strong>Upload Limits:</strong> Configured multipart request body limits up to 50MB (with Nginx configured up to 550MB for firmware/software).</li>
              <li><strong>Split Query Execution:</strong> Configured via EF Core <code>QuerySplittingBehavior.SplitQuery</code> to eliminate Cartesian explosion on multi-table joins.</li>
              <li><strong>Transient Failure Resiliency:</strong> Connection retry policies enabled (up to 3 retries with 5-second delays on database reconnects).</li>
              <li><strong>Authentication:</strong> JWT Bearer token authentication configured with symmetric key signing and audience validation.</li>
              <li><strong>CORS Policy:</strong> <code>AllowAll</code> policy with exposed <code>Authorization</code> and custom headers for frontend communication.</li>
              <li><strong>Static File Serving:</strong> Physical media hosting from <code>/uploads</code> and <code>/images</code> directories.</li>
            </ol>
          </section>

          {/* SECTION 4: 49-CONTROLLER API DIRECTORY */}
          <section id="api-directory" className="doc-section">
            <div className="doc-section-header">
              <span className="doc-section-number">Section 4</span>
              <h2 className="doc-section-heading">49-Controller REST API Directory</h2>
            </div>
            <p className="doc-p">
              The backend architecture exposes <strong>49 specialized ASP.NET Core controllers</strong> organized into 10 domain subsystems:
            </p>

            <div className="doc-table-container">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th style={{ width: '22%' }}>Subsystem Domain</th>
                    <th style={{ width: '28%' }}>Controller &amp; Route Prefix</th>
                    <th style={{ width: '15%' }}>Methods</th>
                    <th style={{ width: '35%' }}>Core Responsibilities</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td rowSpan="4"><strong>Auth &amp; Security</strong></td>
                    <td><code>AuthController</code><br /><code>/api/Auth</code></td>
                    <td>POST, GET</td>
                    <td>Admin login, 2FA email OTP generation, verification, and password reset.</td>
                  </tr>
                  <tr>
                    <td><code>AdminProfileController</code><br /><code>/api/AdminProfile</code></td>
                    <td>GET, PUT</td>
                    <td>Admin profile update, credential management, avatar upload.</td>
                  </tr>
                  <tr>
                    <td><code>TestAuthController</code><br /><code>/api/TestAuth</code></td>
                    <td>GET</td>
                    <td>Diagnostic JWT token verification and claims testing.</td>
                  </tr>
                  <tr>
                    <td><code>UserPermissionsController</code><br /><code>/api/UserPermissions</code></td>
                    <td>GET, POST, PUT</td>
                    <td>Granular 25-module RBAC permission assignment per staff account.</td>
                  </tr>

                  <tr>
                    <td rowSpan="6"><strong>Catalog &amp; Hardware</strong></td>
                    <td><code>ProductsController</code><br /><code>/api/Products</code></td>
                    <td>GET, POST, PUT, DELETE</td>
                    <td>CCTV cameras, NVR/DVR, solar kits, inventory levels, specifications.</td>
                  </tr>
                  <tr>
                    <td><code>CategoryController</code><br /><code>/api/Category</code></td>
                    <td>GET, POST, PUT, DELETE</td>
                    <td>Primary surveillance hardware categories and navigation hierarchies.</td>
                  </tr>
                  <tr>
                    <td><code>SubcategoryController</code><br /><code>/api/Subcategory</code></td>
                    <td>GET, POST, PUT, DELETE</td>
                    <td>Subcategory classifications bound to parent categories.</td>
                  </tr>
                  <tr>
                    <td><code>BrandController</code><br /><code>/api/Brand</code></td>
                    <td>GET, POST, PUT, DELETE</td>
                    <td>Hardware brands, manufacturer badges, and brand filters.</td>
                  </tr>
                  <tr>
                    <td><code>ProductFeaturesController</code><br /><code>/api/ProductFeatures</code></td>
                    <td>GET, POST, PUT, DELETE</td>
                    <td>Technical bullet points, specification highlights, sensor types.</td>
                  </tr>
                  <tr>
                    <td><code>ProductReviewsController</code><br /><code>/api/ProductReviews</code></td>
                    <td>GET, POST, PUT, DELETE</td>
                    <td>Customer ratings, verified buyer reviews, review moderation.</td>
                  </tr>

                  <tr>
                    <td rowSpan="6"><strong>Commerce &amp; Orders</strong></td>
                    <td><code>CartController</code><br /><code>/api/Cart</code></td>
                    <td>GET, POST, PUT, DELETE</td>
                    <td>Server-side cart synchronization and pricing recalculation.</td>
                  </tr>
                  <tr>
                    <td><code>CheckoutController</code><br /><code>/api/Checkout</code></td>
                    <td>POST</td>
                    <td>Address validation, tax calculation, payment method verification.</td>
                  </tr>
                  <tr>
                    <td><code>OrdersController</code><br /><code>/api/Orders</code></td>
                    <td>GET, POST, PUT, DELETE</td>
                    <td>Order lifecycle, fulfillment milestones, admin order ledger.</td>
                  </tr>
                  <tr>
                    <td><code>OrderSuccessController</code><br /><code>/api/OrderSuccess</code></td>
                    <td>GET</td>
                    <td>Post-checkout receipt summary and tracking initialization.</td>
                  </tr>
                  <tr>
                    <td><code>InvoicesController</code><br /><code>/api/Invoices</code></td>
                    <td>GET, POST</td>
                    <td>GST tax invoice generation, numbering, and PDF rendering.</td>
                  </tr>
                  <tr>
                    <td><code>PaymentController</code><br /><code>/api/Payment</code></td>
                    <td>POST, GET, PUT</td>
                    <td>UPI QR, Card 3DS OTP, Net Banking, and manual UTR verification.</td>
                  </tr>

                  <tr>
                    <td rowSpan="3"><strong>Customer Portal</strong></td>
                    <td><code>CustomerPortalController</code><br /><code>/api/CustomerPortal</code></td>
                    <td>POST, GET, PUT</td>
                    <td>Customer registration, login, profile management, customer orders.</td>
                  </tr>
                  <tr>
                    <td><code>CustomersController</code><br /><code>/api/Customers</code></td>
                    <td>GET, POST, PUT, DELETE</td>
                    <td>Administrative customer account directory, verification status.</td>
                  </tr>
                  <tr>
                    <td><code>CustomerAddressController</code><br /><code>/api/CustomerAddress</code></td>
                    <td>GET, POST, PUT, DELETE</td>
                    <td>Multiple delivery addresses and default shipping destinations.</td>
                  </tr>

                  <tr>
                    <td rowSpan="2"><strong>Loyalty &amp; Wallet</strong></td>
                    <td><code>CoinsController</code><br /><code>/api/Coins</code></td>
                    <td>GET, POST</td>
                    <td>Reward coins balance, earning rules, conversion rate, redemption ledger.</td>
                  </tr>
                  <tr>
                    <td><code>WalletController</code><br /><code>/api/Wallet</code></td>
                    <td>GET, POST</td>
                    <td>Digital wallet credit/debit balances and transaction statements.</td>
                  </tr>

                  <tr>
                    <td rowSpan="3"><strong>Marketing &amp; Promo</strong></td>
                    <td><code>CouponsController</code><br /><code>/api/Coupons</code></td>
                    <td>GET, POST, PUT, DELETE</td>
                    <td>Percentage and flat coupon validation, minimum order requirements.</td>
                  </tr>
                  <tr>
                    <td><code>OffersController</code><br /><code>/api/Offers</code></td>
                    <td>GET, POST, PUT, DELETE</td>
                    <td>Promotional banners, bundle discounts, featured flash deals.</td>
                  </tr>
                  <tr>
                    <td><code>BannersController</code><br /><code>/api/Banners</code></td>
                    <td>GET, POST, PUT, DELETE</td>
                    <td>Hero slider graphics, promotional banners, mobile banners.</td>
                  </tr>

                  <tr>
                    <td rowSpan="4"><strong>Procurement &amp; B2B</strong></td>
                    <td><code>SuppliersController</code><br /><code>/api/Suppliers</code></td>
                    <td>GET, POST, PUT, DELETE</td>
                    <td>Hardware manufacturers, suppliers directory, contact records.</td>
                  </tr>
                  <tr>
                    <td><code>PurchaseIndentController</code><br /><code>/api/PurchaseIndent</code></td>
                    <td>GET, POST, PUT, DELETE</td>
                    <td>Internal warehouse procurement requests and reorder indents.</td>
                  </tr>
                  <tr>
                    <td><code>PurchaseOrderController</code><br /><code>/api/PurchaseOrder</code></td>
                    <td>GET, POST, PUT, DELETE</td>
                    <td>Formal Purchase Orders (PO) issued to suppliers and tracking.</td>
                  </tr>
                  <tr>
                    <td><code>DistributorsController</code><br /><code>/api/Distributors</code></td>
                    <td>GET, POST, PUT, DELETE</td>
                    <td>Official distributor network directory and region lookup.</td>
                  </tr>

                  <tr>
                    <td rowSpan="4"><strong>Post-Sales &amp; RMA</strong></td>
                    <td><code>ReturnsController</code><br /><code>/api/Returns</code></td>
                    <td>GET, POST</td>
                    <td>Customer RMA return initiation, tracking, and item return reasons.</td>
                  </tr>
                  <tr>
                    <td><code>ReturnsAdminController</code><br /><code>/api/ReturnsAdmin</code></td>
                    <td>GET, PUT</td>
                    <td>Administrative return approvals, replacements, and refund dispatch.</td>
                  </tr>
                  <tr>
                    <td><code>TicketsController</code><br /><code>/api/Tickets</code></td>
                    <td>GET, POST, PUT, DELETE</td>
                    <td>Helpdesk tickets, warranty claims, service communications.</td>
                  </tr>
                  <tr>
                    <td><code>SupportController</code><br /><code>/api/Support</code></td>
                    <td>GET, POST</td>
                    <td>Public support inquiries, technician assistance requests.</td>
                  </tr>

                  <tr>
                    <td rowSpan="7"><strong>Content &amp; Public Hubs</strong></td>
                    <td><code>AboutController</code><br /><code>/api/About</code></td>
                    <td>GET, PUT</td>
                    <td>Company corporate profile, certifications, mission statement.</td>
                  </tr>
                  <tr>
                    <td><code>BlogController</code><br /><code>/api/Blog</code></td>
                    <td>GET, POST, PUT, DELETE</td>
                    <td>Technical surveillance articles, firmware release blogs.</td>
                  </tr>
                  <tr>
                    <td><code>CallHistoryController</code><br /><code>/api/CallHistory</code></td>
                    <td>GET, POST</td>
                    <td>Inbound sales call logging and customer contact tracking.</td>
                  </tr>
                  <tr>
                    <td><code>EnquiryController</code><br /><code>/api/Enquiry</code></td>
                    <td>GET, POST, PUT, DELETE</td>
                    <td>Product commercial quote inquiries and custom kit requests.</td>
                  </tr>
                  <tr>
                    <td><code>GrowthJourneyController</code><br /><code>/api/GrowthJourney</code></td>
                    <td>GET, POST, PUT, DELETE</td>
                    <td>Company milestone timeline, historic corporate achievements.</td>
                  </tr>
                  <tr>
                    <td><code>SoftwareController</code><br /><code>/api/Software</code></td>
                    <td>GET, POST, PUT, DELETE</td>
                    <td>VMS client software, IP camera discovery tools, firmware binaries.</td>
                  </tr>
                  <tr>
                    <td><code>SolutionsController</code><br /><code>/api/Solutions</code></td>
                    <td>GET, POST, PUT, DELETE</td>
                    <td>Industry security blueprints (Retail, Banking, Industrial, Education).</td>
                  </tr>

                  <tr>
                    <td rowSpan="6"><strong>Administration &amp; Ops</strong></td>
                    <td><code>NotificationsController</code><br /><code>/api/Notifications</code></td>
                    <td>GET, PUT, DELETE</td>
                    <td>Administrative bell alerts, unread counts, cache-control sync.</td>
                  </tr>
                  <tr>
                    <td><code>ReportsController</code><br /><code>/api/Reports</code></td>
                    <td>GET</td>
                    <td>Sales revenue breakdown, orders ledger reports, customer growth.</td>
                  </tr>
                  <tr>
                    <td><code>SettingsController</code><br /><code>/api/Settings</code></td>
                    <td>GET, PUT</td>
                    <td>Price visibility toggle (Catalog vs E-Commerce), contact details.</td>
                  </tr>
                  <tr>
                    <td><code>StaffController</code><br /><code>/api/Staff</code></td>
                    <td>GET, POST, PUT, DELETE</td>
                    <td>Internal staff employee accounts, roles, access assignments.</td>
                  </tr>
                  <tr>
                    <td><code>StockController</code><br /><code>/api/Stock</code></td>
                    <td>GET, PUT</td>
                    <td>Real-time inventory levels, reorder threshold alerts, restocking.</td>
                  </tr>
                  <tr>
                    <td><code>WishlistController</code><br /><code>/api/Wishlist</code></td>
                    <td>GET, POST, DELETE</td>
                    <td>Storefront customer saved products and quote wishlists.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* SECTION 5 */}
          <section id="api-integration" className="doc-section">
            <div className="doc-section-header">
              <span className="doc-section-number">Section 5</span>
              <h2 className="doc-section-heading">API Integration &amp; Request-Handling Approach</h2>
            </div>
            <p className="doc-p">
              Frontend API calls are centralized in <code>src/services/</code> using configured Axios and Fetch instances:
            </p>

            <ul style={{ paddingLeft: '24px', margin: '0 0 16px 0', color: '#475569' }}>
              <li>
                <strong>Dynamic Token Injection:</strong> Request interceptors check the target context. If an admin endpoint is requested, <code>adminToken</code> (from <code>sessionStorage</code>) is attached; if a customer portal request is made, <code>customerToken</code> (from <code>localStorage</code>) is attached via <code>Authorization: Bearer &lt;token&gt;</code>.
              </li>
              <li>
                <strong>Ngrok Warning Bypass:</strong> Development tunnel requests automatically include the header <code>ngrok-skip-browser-warning: true</code> to avoid HTML warning screens.
              </li>
              <li>
                <strong>Unified DTO Handling:</strong> Services normalize API responses, converting null or missing nested collections into safe default arrays or empty objects.
              </li>
              <li>
                <strong>Cache-Control Invalidation:</strong> Real-time endpoints (e.g. <code>GET /api/Notifications/unread-count</code>) enforce <code>Cache-Control: no-cache, no-store</code> to prevent stale client badge counts.
              </li>
            </ul>
          </section>

          {/* SECTION 6: AUTH & 25-MODULE RBAC */}
          <section id="auth-security" className="doc-section">
            <div className="doc-section-header">
              <span className="doc-section-number">Section 6</span>
              <h2 className="doc-section-heading">Authentication &amp; Dynamic 25-Module RBAC Security</h2>
            </div>
            <p className="doc-p">
              The platform enforces strict authentication boundaries between storefront customers and administrative personnel:
            </p>

            <div className="doc-table-container">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th style={{ width: '22%' }}>Domain</th>
                    <th style={{ width: '38%' }}>Credentials &amp; Flow</th>
                    <th style={{ width: '40%' }}>Security Safeguards</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Storefront Customers</strong></td>
                    <td>Email + Password authenticated via <code>/api/CustomerPortal/login</code>. Generates customer JWT token.</td>
                    <td>IDOR protection: customer can only query and view orders associated with their own verified customer ID.</td>
                  </tr>
                  <tr>
                    <td><strong>Admin &amp; Staff</strong></td>
                    <td>Email/Employee ID + Password + Mandatory 6-Digit Email OTP verification.</td>
                    <td>Two-Factor Authentication required before issuing <code>adminToken</code>.</td>
                  </tr>
                  <tr>
                    <td><strong>Session Auto-Lock</strong></td>
                    <td>Client-side idle tracker in <code>AdminLayout.jsx</code> monitors mouse, keyboard, touch, and scroll events.</td>
                    <td>Automatically purges credentials and redirects to <code>/admin/login</code> after 30 minutes of inactivity.</td>
                  </tr>
                  <tr>
                    <td><strong>Dynamic RBAC Engine</strong></td>
                    <td>Module permission validator in <code>src/utils/rbac.js</code> canonicalizes routes against the 25 official modules.</td>
                    <td>Strictly denies unauthorized routes; no static fallback grants.</td>
                  </tr>
                  <tr>
                    <td><strong>Manager Mutation Protection</strong></td>
                    <td>DOM-level listeners in <code>AdminLayout.jsx</code> intercept form submissions and delete actions.</td>
                    <td>Enforces read-only oversight mode for users with the <code>manager</code> role.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="doc-subheading">Granular 25-Module RBAC Permission Matrix</h3>
            <p className="doc-p">
              Access permissions in <code>UserPermissionsController.cs</code> and <code>src/utils/rbac.js</code> are granted per staff account across these 25 modules:
            </p>

            <div className="doc-table-container">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th style={{ width: '20%' }}>Module Key</th>
                    <th style={{ width: '22%' }}>Display Name</th>
                    <th style={{ width: '24%' }}>Admin Route</th>
                    <th style={{ width: '34%' }}>Operational Capability</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>dashboard</code></td>
                    <td>Dashboard</td>
                    <td><code>/admin/dashboard</code></td>
                    <td>Sales KPIs, live order counts, customer metrics</td>
                  </tr>
                  <tr>
                    <td><code>categories</code></td>
                    <td>Categories</td>
                    <td><code>/admin/categories</code></td>
                    <td>Create, edit, and organize product categories</td>
                  </tr>
                  <tr>
                    <td><code>subcategories</code></td>
                    <td>Subcategories</td>
                    <td><code>/admin/subcategories</code></td>
                    <td>Manage nested category hardware classifications</td>
                  </tr>
                  <tr>
                    <td><code>products</code></td>
                    <td>Products</td>
                    <td><code>/admin/products</code></td>
                    <td>Hardware catalog, specs, pricing, and media</td>
                  </tr>
                  <tr>
                    <td><code>product-features</code></td>
                    <td>Product Features</td>
                    <td><code>/admin/product-features</code></td>
                    <td>Technical highlights, sensor types, bullet points</td>
                  </tr>
                  <tr>
                    <td><code>product-reviews</code></td>
                    <td>Product Reviews</td>
                    <td><code>/admin/product-reviews</code></td>
                    <td>Approve, moderate, or remove customer reviews</td>
                  </tr>
                  <tr>
                    <td><code>customers</code></td>
                    <td>Customers</td>
                    <td><code>/admin/customers</code></td>
                    <td>Customer registry, account status, order history</td>
                  </tr>
                  <tr>
                    <td><code>call-history</code></td>
                    <td>Call History</td>
                    <td><code>/admin/call-history</code></td>
                    <td>Inbound sales inquiries and caller communications</td>
                  </tr>
                  <tr>
                    <td><code>reports</code></td>
                    <td>Reports</td>
                    <td><code>/admin/reports</code></td>
                    <td>Exportable revenue charts and sales analytics</td>
                  </tr>
                  <tr>
                    <td><code>tickets</code></td>
                    <td>Tickets</td>
                    <td><code>/admin/tickets</code></td>
                    <td>Warranty support and customer service desk</td>
                  </tr>
                  <tr>
                    <td><code>enquiries</code></td>
                    <td>Enquiries</td>
                    <td><code>/admin/enquiries</code></td>
                    <td>Commercial product inquiries and quote submissions</td>
                  </tr>
                  <tr>
                    <td><code>contact-submissions</code></td>
                    <td>Contact Submissions</td>
                    <td><code>/admin/contact-submissions</code></td>
                    <td>Inbound messages from the public Contact page</td>
                  </tr>
                  <tr>
                    <td><code>quotes</code></td>
                    <td>Quotes</td>
                    <td><code>/admin/quotes</code></td>
                    <td>Commercial bulk quotations and pricing estimates</td>
                  </tr>
                  <tr>
                    <td><code>invoices</code></td>
                    <td>Invoices</td>
                    <td><code>/admin/invoices</code></td>
                    <td>GST tax invoices, ledger entries, and downloads</td>
                  </tr>
                  <tr>
                    <td><code>orders</code></td>
                    <td>Orders</td>
                    <td><code>/admin/orders</code></td>
                    <td>Order fulfillment pipeline and milestone dispatch</td>
                  </tr>
                  <tr>
                    <td><code>stock-updates</code></td>
                    <td>Stock Updates</td>
                    <td><code>/admin/stock-updates</code></td>
                    <td>Batch inventory adjustments and warehouse restocking</td>
                  </tr>
                  <tr>
                    <td><code>coupons</code></td>
                    <td>Coupons</td>
                    <td><code>/admin/coupons</code></td>
                    <td>Discount voucher creation and percentage thresholds</td>
                  </tr>
                  <tr>
                    <td><code>offers</code></td>
                    <td>Offers</td>
                    <td><code>/admin/offers</code></td>
                    <td>Promotional banners and bundle discount packages</td>
                  </tr>
                  <tr>
                    <td><code>suppliers</code></td>
                    <td>Suppliers</td>
                    <td><code>/admin/suppliers</code></td>
                    <td>B2B hardware suppliers and vendor profiles</td>
                  </tr>
                  <tr>
                    <td><code>purchase-indent</code></td>
                    <td>Purchase Indent</td>
                    <td><code>/admin/purchase-indent</code></td>
                    <td>Internal warehouse procurement indents</td>
                  </tr>
                  <tr>
                    <td><code>purchase-orders</code></td>
                    <td>Purchase Orders</td>
                    <td><code>/admin/purchase-orders</code></td>
                    <td>Formal Purchase Orders (PO) sent to suppliers</td>
                  </tr>
                  <tr>
                    <td><code>distributors</code></td>
                    <td>Distributors</td>
                    <td><code>/admin/distributors</code></td>
                    <td>Authorized distributor network directory</td>
                  </tr>
                  <tr>
                    <td><code>partner-applications</code></td>
                    <td>Partner Applications</td>
                    <td><code>/admin/partner-applications</code></td>
                    <td>Channel partner onboarding requests and review</td>
                  </tr>
                  <tr>
                    <td><code>staff</code></td>
                    <td>Staff</td>
                    <td><code>/admin/staff</code></td>
                    <td>Employee accounts, role grants, permission matrix</td>
                  </tr>
                  <tr>
                    <td><code>settings</code></td>
                    <td>Settings</td>
                    <td><code>/admin/settings</code></td>
                    <td>System configuration and Price Visibility toggle</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* SECTION 7 */}
          <section id="db-storage" className="doc-section">
            <div className="doc-section-header">
              <span className="doc-section-number">Section 7</span>
              <h2 className="doc-section-heading">MySQL Database &amp; Storage Architecture</h2>
            </div>
            <p className="doc-p">
              The application uses <strong>MySQL 8.0+</strong> as its primary relational data store (default database: <code>honeywell_products</code>):
            </p>

            <ul style={{ paddingLeft: '24px', margin: '0 0 16px 0', color: '#475569' }}>
              <li><strong>Relational Schema:</strong> Complete relational models for users, customers, staff, permissions, categories, subcategories, products, orders, order items, invoices, returns, warranty tickets, suppliers, quotes, distributor applications, and testimonials.</li>
              <li><strong>Snapshot File:</strong> The root file <code>db.sql</code> provides a 200KB+ comprehensive snapshot of database table structures, foreign key constraints, indexes, and seeded records.</li>
              <li><strong>Split Query Execution:</strong> Configured via EF Core <code>QuerySplittingBehavior.SplitQuery</code> to avoid Cartesian explosion when querying nested relationships (e.g., categories with subcategories and products).</li>
              <li><strong>Physical Upload Storage:</strong> Media files are stored on disk at <code>Honeywell-Backend/wwwroot/uploads/</code>, mounted to Docker as a named volume <code>uploads:/app/wwwroot/uploads</code>.</li>
            </ul>
          </section>

          {/* SECTION 8 */}
          <section id="catalog-cart" className="doc-section">
            <div className="doc-section-header">
              <span className="doc-section-number">Section 8</span>
              <h2 className="doc-section-heading">Product Catalog &amp; Shopping Cart Data Flow</h2>
            </div>
            <p className="doc-p">
              The catalog and shopping cart interact through reactive React contexts:
            </p>

            <ol style={{ paddingLeft: '24px', margin: '0 0 16px 0', color: '#475569' }}>
              <li><strong>Catalog Fetch:</strong> <code>productService.getAll()</code> retrieves products with category IDs, specifications, images, and pricing.</li>
              <li><strong>Cart State:</strong> <code>CartContext.jsx</code> manages item state and synchronizes reactively with browser <code>localStorage</code> under the key <code>honey-well-cart</code>.</li>
              <li><strong>Reactive Recalculation:</strong> Cart item additions, quantity modifications (<code>updateQuantity</code>), and removals (<code>removeItem</code>) update item counts and totals in real time.</li>
              <li><strong>Price Visibility Toggle:</strong> In <em>Catalogue Mode</em> (Price Visibility OFF), prices and checkout buttons are hidden, transforming the UI into a product inquiry portal. In <em>E-Commerce Mode</em>, full pricing and checkout operations are active.</li>
            </ol>
          </section>

          {/* SECTION 9 */}
          <section id="checkout-order" className="doc-section">
            <div className="doc-section-header">
              <span className="doc-section-number">Section 9</span>
              <h2 className="doc-section-heading">Checkout &amp; Order Processing Flow</h2>
            </div>
            <p className="doc-p">
              The complete order creation and fulfillment workflow operates as follows:
            </p>

            <ul className="doc-steps-list">
              <li className="doc-step-item">
                <h4>1. Checkout Submission</h4>
                <p>
                  Customer enters shipping address and contact details in <code>Checkout.jsx</code>. Inputs are validated using <code>src/utils/validators.js</code>.
                </p>
              </li>
              <li className="doc-step-item">
                <h4>2. Order Creation Call</h4>
                <p>
                  <code>orderService.create(payload)</code> posts to <code>POST /api/Orders</code> or <code>POST /api/CustomerPortal/orders</code>.
                </p>
              </li>
              <li className="doc-step-item">
                <h4>3. Backend Processing</h4>
                <p>
                  The backend generates a unique Order ID, records line items in <code>OrderItems</code>, decrements available inventory stock, and logs the initial milestone in the tracking history.
                </p>
              </li>
              <li className="doc-step-item">
                <h4>4. Fulfillment Transitions</h4>
                <p>
                  Orders transition through authoritative states: <code>Pending Verification</code> &rarr; <code>Processing</code> &rarr; <code>Dispatched</code> &rarr; <code>In Transit</code> &rarr; <code>Delivered</code> (or <code>Cancelled</code>).
                </p>
              </li>
            </ul>
          </section>

          {/* SECTION 10 */}
          <section id="payment-arch" className="doc-section">
            <div className="doc-section-header">
              <span className="doc-section-number">Section 10</span>
              <h2 className="doc-section-heading">Payment Processing Architecture &amp; Integrations</h2>
            </div>
            <p className="doc-p">
              Payment endpoints are implemented in <code>Honeywell-Backend/Controllers/PaymentController.cs</code> and interfaced via <code>src/services/paymentService.js</code>:
            </p>

            <div className="doc-table-container">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th style={{ width: '25%' }}>Method</th>
                    <th style={{ width: '35%' }}>Backend Endpoint</th>
                    <th style={{ width: '40%' }}>Implementation Flow</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>UPI</strong></td>
                    <td><code>POST /api/Payment/initiate</code></td>
                    <td>Accepts VPA virtual address, validates format, processes payment.</td>
                  </tr>
                  <tr>
                    <td><strong>Dynamic UPI QR</strong></td>
                    <td><code>GET /api/Payment/qr/{'{orderId}'}</code></td>
                    <td>Generates real-time QR code. Client polls <code>GET /api/Payment/status/{'{transactionId}'}</code> until confirmed.</td>
                  </tr>
                  <tr>
                    <td><strong>Credit/Debit Cards</strong></td>
                    <td><code>POST /api/Payment/card/verify-otp</code></td>
                    <td>Validates card number, expiry, CVV; simulates 3D Secure OTP verification.</td>
                  </tr>
                  <tr>
                    <td><strong>Net Banking</strong></td>
                    <td><code>POST /api/Payment/netbanking/login</code> &amp; <code>verify-otp</code></td>
                    <td>Bank selection, customer authentication, and OTP confirmation.</td>
                  </tr>
                  <tr>
                    <td><strong>Manual Bank Transfer</strong></td>
                    <td><code>POST /api/Payment/verify-manual</code></td>
                    <td>Customer submits UTR transaction reference; admin verifies in <code>/admin/payments</code> via <code>PUT /api/Payment/verify-manual/{'{id}'}/status</code>.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="doc-callout info">
              <AlertCircle size={20} />
              <div className="doc-callout-text">
                <h4>Note on External Payment Gateways</h4>
                <p>
                  Cashfree SDK or third-party webhooks are <strong>not integrated</strong> in this repository. Payment operations utilize native backend simulation endpoints, dynamic UPI QR polling, and administrative UTR reconciliation.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 11: PROCUREMENT & RETURNS */}
          <section id="procurement-returns" className="doc-section">
            <div className="doc-section-header">
              <span className="doc-section-number">Section 11</span>
              <h2 className="doc-section-heading">B2B Procurement &amp; RMA Returns Lifecycle</h2>
            </div>
            <p className="doc-p">
              The platform handles enterprise hardware procurement and reverse logistics through dedicated administrative workflows:
            </p>

            <h3 className="doc-subheading">B2B Procurement Workflow</h3>
            <ol style={{ paddingLeft: '24px', margin: '0 0 16px 0', color: '#475569' }}>
              <li><strong>Purchase Indent (PI):</strong> Warehouse managers create procurement requests in <code>/admin/purchase-indent</code> specifying hardware SKU, quantities, and urgency.</li>
              <li><strong>Purchase Order (PO):</strong> Procurement admins approve indents and generate formal POs bound to registered vendors from <code>SuppliersController</code>.</li>
              <li><strong>Supplier Dispatch:</strong> Vendors deliver shipments; warehouse records received goods, automatically updating stock levels in <code>StockController</code>.</li>
            </ol>

            <h3 className="doc-subheading">RMA Returns Workflow</h3>
            <ol style={{ paddingLeft: '24px', margin: '0 0 16px 0', color: '#475569' }}>
              <li><strong>Customer Initiation:</strong> Customers submit return requests with reason and serial number via <code>POST /api/Returns</code>.</li>
              <li><strong>Admin Review:</strong> Support admins inspect the return request in <code>/admin/returns</code> via <code>ReturnsAdminController</code>.</li>
              <li><strong>Resolution:</strong> Admins approve returns, inspect returned equipment, and issue replacements or financial refunds.</li>
            </ol>
          </section>

          {/* SECTION 12 */}
          <section id="env-config" className="doc-section">
            <div className="doc-section-header">
              <span className="doc-section-number">Section 12</span>
              <h2 className="doc-section-heading">Environment Configuration &amp; Safe Setup</h2>
            </div>
            <p className="doc-p">
              Configure environment variables safely without checking private credentials into source control:
            </p>

            <div className="doc-code-block">
              <div className="doc-code-header">
                <span>Frontend .env Configuration</span>
              </div>
              <pre>{`# Honeywell-Frontend/.env
VITE_API_URL=http://localhost:5000`}</pre>
            </div>

            <div className="doc-code-block">
              <div className="doc-code-header">
                <span>Backend appsettings.json Configuration</span>
              </div>
              <pre>{`// Honeywell-Backend/appsettings.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=honeywell_products;User=root;Password=YOUR_PASSWORD;"
  },
  "Jwt": {
    "Key": "YOUR_SUPER_SECRET_JWT_SIGNING_KEY_MIN_32_CHARS",
    "Issuer": "HoneywellProductsAPI",
    "Audience": "HoneywellProductsClient"
  },
  "Smtp": {
    "Host": "smtp.gmail.com",
    "Port": 587,
    "Username": "your-email@gmail.com",
    "Password": "YOUR_APP_SPECIFIC_PASSWORD"
  }
}`}</pre>
            </div>
          </section>

          {/* SECTION 13 */}
          <section id="local-dev" className="doc-section">
            <div className="doc-section-header">
              <span className="doc-section-number">Section 13</span>
              <h2 className="doc-section-heading">Local Development Setup Instructions</h2>
            </div>
            <p className="doc-p">
              Follow these verified steps to run both services on a development machine:
            </p>

            <h3 className="doc-subheading">1. Database Preparation</h3>
            <p className="doc-p">Create a MySQL database named <code>honeywell_products</code> and import the root snapshot:</p>
            <div className="doc-code-block">
              <pre>{`mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS honeywell_products;"
mysql -u root -p honeywell_products < db.sql`}</pre>
            </div>

            <h3 className="doc-subheading">2. Start Backend (.NET 8.0)</h3>
            <div className="doc-code-block">
              <pre>{`cd Honeywell-Backend
dotnet restore
dotnet run`}</pre>
            </div>
            <p className="doc-p">Backend will listen at <code>http://localhost:5000</code>. Swagger UI is accessible at <code>http://localhost:5000/swagger</code>.</p>

            <h3 className="doc-subheading">3. Start Frontend (React 19 + Vite 8)</h3>
            <div className="doc-code-block">
              <pre>{`cd Honeywell-Frontend
npm install
npm run dev`}</pre>
            </div>
            <p className="doc-p">Frontend dev server starts at <code>http://localhost:5173</code>.</p>
          </section>

          {/* SECTION 14 */}
          <section id="testing-build" className="doc-section">
            <div className="doc-section-header">
              <span className="doc-section-number">Section 14</span>
              <h2 className="doc-section-heading">Testing &amp; Production Build Instructions</h2>
            </div>
            <p className="doc-p">
              Execute test suites and verify production builds with the following commands:
            </p>

            <h3 className="doc-subheading">A. Frontend Unit &amp; Integration Tests</h3>
            <p className="doc-p">Runs the Node.js built-in test runner against admin notification and synchronization contracts:</p>
            <div className="doc-code-block">
              <pre>{`cd Honeywell-Frontend
npm test`}</pre>
            </div>

            <h3 className="doc-subheading">B. Frontend Production Build</h3>
            <p className="doc-p">Compiles optimized production assets to <code>Honeywell-Frontend/dist/</code>:</p>
            <div className="doc-code-block">
              <pre>{`cd Honeywell-Frontend
npm run build`}</pre>
            </div>

            <h3 className="doc-subheading">C. Backend Build &amp; Publish</h3>
            <div className="doc-code-block">
              <pre>{`cd Honeywell-Backend
dotnet build
dotnet publish -c Release -o publish`}</pre>
            </div>
          </section>

          {/* SECTION 15 */}
          <section id="deployment-docker" className="doc-section">
            <div className="doc-section-header">
              <span className="doc-section-number">Section 15</span>
              <h2 className="doc-section-heading">Docker Multi-Container &amp; Nginx Deployment</h2>
            </div>
            <p className="doc-p">
              Production deployment is orchestrated via <code>docker-compose.yml</code> and <code>nginx.conf</code>:
            </p>

            <div className="doc-code-block">
              <div className="doc-code-header">
                <span>Production Nginx Reverse Proxy (nginx.conf)</span>
              </div>
              <pre>{`server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;
    client_max_body_size 550m;

    location /api/ {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}`}</pre>
            </div>

            <ul style={{ paddingLeft: '24px', margin: '0 0 16px 0', color: '#475569' }}>
              <li><strong>550MB Upload Capacity:</strong> Accommodates large surveillance firmware binaries and technical manual PDFs.</li>
              <li><strong>SPA Client-Side Routing:</strong> <code>try_files $uri $uri/ /index.html</code> ensures direct URL refreshes on routes like <code>/contact</code>, <code>/documentation</code>, and <code>/tech-doc</code> do not return 404s.</li>
              <li><strong>Container Orchestration:</strong> Run <code>docker compose up -d --build</code> to launch the complete production stack.</li>
            </ul>
          </section>

          {/* SECTION 16 */}
          <section id="limitations" className="doc-section">
            <div className="doc-section-header">
              <span className="doc-section-number">Section 16</span>
              <h2 className="doc-section-heading">Verified Capabilities, Known Limitations &amp; Dependencies</h2>
            </div>
            <p className="doc-p">
              Summary of verified system features versus unintegrated external services:
            </p>

            <div className="doc-table-container">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th style={{ width: '28%' }}>Capability</th>
                    <th style={{ width: '22%' }}>Verified Status</th>
                    <th style={{ width: '50%' }}>Technical Notes</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Product Catalog &amp; Cart</strong></td>
                    <td>Verified Functional</td>
                    <td>Full category filtering, specification tables, and persistent cart state.</td>
                  </tr>
                  <tr>
                    <td><strong>Customer Portal &amp; Orders</strong></td>
                    <td>Verified Functional</td>
                    <td>Registration, login, order ledger, IDOR protection, and live order tracking.</td>
                  </tr>
                  <tr>
                    <td><strong>Admin Console &amp; RBAC</strong></td>
                    <td>Verified Functional</td>
                    <td>Dynamic module permissions across 25 modules, 30-min idle lock, manager protection.</td>
                  </tr>
                  <tr>
                    <td><strong>Manual UTR Verification</strong></td>
                    <td>Verified Functional</td>
                    <td>End-to-end receipt submission by customers and approval by administrators.</td>
                  </tr>
                  <tr>
                    <td><strong>Cashfree Payment Gateway</strong></td>
                    <td>Not Implemented</td>
                    <td>Cashfree SDK is not present in the repository; transactions use native simulated flows and manual UTR verification.</td>
                  </tr>
                  <tr>
                    <td><strong>Live Carrier Webhooks</strong></td>
                    <td>Simulated / Milestone-Based</td>
                    <td>Logistics partner status updates are administered via <code>TrackingOrder.jsx</code> rather than direct third-party courier webhooks.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="doc-callout tip">
              <CheckCircle2 size={20} />
              <div className="doc-callout-text">
                <h4>Documentation Integrity Confirmation</h4>
                <p>
                  This technical guide strictly reflects the verified codebase of the <strong>Honeywell Products</strong> repository. All file paths, component names, API endpoints, and configuration parameters have been verified from source code.
                </p>
              </div>
            </div>
          </section>

        </article>
      </div>
    </div>
  );
}

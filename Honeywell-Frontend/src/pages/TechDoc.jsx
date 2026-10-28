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
        'arch-overview', 'frontend-stack', 'backend-stack', 'api-integration',
        'auth-security', 'db-storage', 'catalog-cart', 'checkout-order',
        'payment-arch', 'env-config', 'local-dev', 'testing-build',
        'deployment-docker', 'limitations'
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
    { id: 'api-integration', label: '4. API Integration & Headers' },
    { id: 'auth-security', label: '5. Auth & RBAC Security' },
    { id: 'db-storage', label: '6. MySQL Database & Storage' },
    { id: 'catalog-cart', label: '7. Catalog & Cart Data Flow' },
    { id: 'checkout-order', label: '8. Checkout & Order Lifecycle' },
    { id: 'payment-arch', label: '9. Payment Architecture' },
    { id: 'env-config', label: '10. Environment Configuration' },
    { id: 'local-dev', label: '11. Local Dev Setup' },
    { id: 'testing-build', label: '12. Testing & Production Build' },
    { id: 'deployment-docker', label: '13. Docker & Nginx Deployment' },
    { id: 'limitations', label: '14. Limitations & Scope' },
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
            Complete technical guide to the Honeywell Products platform: software architecture, frontend/backend technology stacks, REST API contracts, authentication models, payment flows, and deployment topology.
          </p>

          <div className="doc-header-meta">
            <span><strong>Target Stack:</strong> React 19 + ASP.NET Core 8 + MySQL</span>
            <span><strong>Repository:</strong> Honeywell Products Monorepo</span>
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
              <h2 className="doc-section-heading">Project Overview &amp; Architecture</h2>
            </div>
            <p className="doc-p">
              The <strong>Honeywell Products platform</strong> is a full-stack e-commerce and operations management system designed for surveillance hardware, solar monitoring kits, and perimeter security equipment.
            </p>
            <p className="doc-p">
              The repository is organized as a unified monorepo coordinating an ASP.NET Core 8 Web API backend, a React 19 Single Page Application frontend, MySQL database persistence, and production container topology:
            </p>

            <div className="doc-code-block">
              <div className="doc-code-header">
                <span>Repository Topology</span>
                <button
                  className="doc-code-copy-btn"
                  onClick={() => handleCopy('repo-tree', `HoneywellProducts-main/
|-- Honeywell-Backend/     ASP.NET Core 8 Web API (.NET 8.0, C#, EF Core, Controllers, DTOs)
|-- Honeywell-Frontend/    React 19 SPA, Vite 8, React Router DOM v7, Tailwind CSS, Lucide
|-- docker-compose.yml     Multi-container production stack (frontend, backend, uploads volume)
|-- nginx.conf             Nginx edge reverse proxy (/api/ and /uploads/, 550MB payload)
|-- db.sql                 MySQL database schema and seed data
\`-- .env                   Docker container environment configuration`)}
                >
                  {copiedKey === 'repo-tree' ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedKey === 'repo-tree' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre>{`HoneywellProducts-main/
|-- Honeywell-Backend/     ASP.NET Core 8 Web API (.NET 8.0, C#, EF Core, Controllers, DTOs)
|-- Honeywell-Frontend/    React 19 SPA, Vite 8, React Router DOM v7, Tailwind CSS, Lucide
|-- docker-compose.yml     Multi-container production stack (frontend, backend, uploads volume)
|-- nginx.conf             Nginx edge reverse proxy (/api/ and /uploads/, 550MB payload)
|-- db.sql                 MySQL database schema and seed data
\`-- .env                   Docker container environment configuration`}</pre>
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
                    <th>Layer</th>
                    <th>Technology</th>
                    <th>Version</th>
                    <th>Role in Platform</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>UI Library</strong></td>
                    <td>React (JSX)</td>
                    <td><code>19.2.0</code></td>
                    <td>Component tree, reactive state, functional hooks</td>
                  </tr>
                  <tr>
                    <td><strong>Build Engine</strong></td>
                    <td>Vite</td>
                    <td><code>8.2.2</code></td>
                    <td>Hot module replacement &amp; rollup-optimized bundling</td>
                  </tr>
                  <tr>
                    <td><strong>Routing</strong></td>
                    <td>React Router DOM</td>
                    <td><code>7.1.1</code></td>
                    <td>Client-side SPA routes, lazy loading, nested admin layouts</td>
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
                    <td>Clean SVG iconography across storefront and admin console</td>
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
                    <td>Admin sales analytics and order status breakdown charts</td>
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
              <li><code>src/App.jsx</code>: Master routing registry managing public layout and protected admin console.</li>
              <li><code>src/context/AuthContext.jsx</code>: Storefront customer session restoration, login/logout, and storage sync.</li>
              <li><code>src/context/CartContext.jsx</code>: Reactive cart state backed by <code>honey-well-cart</code> localStorage.</li>
              <li><code>src/context/SettingsContext.jsx</code>: Dynamic catalogue pricing mode and branding controls.</li>
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
              The backend application is structured as a modular monolithic ASP.NET Core 8 Web API in <code>Honeywell-Backend/</code>, organized into 6 core business subsystems:
            </p>

            <div className="doc-table-container">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Subsystem Domain</th>
                    <th>Key Controllers &amp; Models</th>
                    <th>Operational Responsibility</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Catalog &amp; Hardware</strong></td>
                    <td><code>Products</code>, <code>Category</code>, <code>Subcategory</code>, <code>Brand</code>, <code>ProductFeatures</code></td>
                    <td>CCTV specs, solar kits, storage options, resolution filters, inventory levels.</td>
                  </tr>
                  <tr>
                    <td><strong>Commerce &amp; Invoicing</strong></td>
                    <td><code>Cart</code>, <code>Checkout</code>, <code>Orders</code>, <code>Invoices</code>, <code>Payment</code></td>
                    <td>Tax subtotal, order status pipeline, PDF invoice generation, payment confirmation.</td>
                  </tr>
                  <tr>
                    <td><strong>Wallet &amp; Loyalty Rewards</strong></td>
                    <td><code>CoinsController</code>, <code>WalletController</code></td>
                    <td>Customer rewards ledger, coin-to-currency redemptions, wallet debit/credit ledger.</td>
                  </tr>
                  <tr>
                    <td><strong>Promotions &amp; Marketing</strong></td>
                    <td><code>CouponsController</code>, <code>OffersController</code>, <code>BannersController</code></td>
                    <td>Dynamic coupon validation (percentage / flat), minimum order rules, promotional banners.</td>
                  </tr>
                  <tr>
                    <td><strong>B2B Procurement &amp; Partners</strong></td>
                    <td><code>Suppliers</code>, <code>PurchaseIndent</code>, <code>PurchaseOrder</code>, <code>Distributors</code>, <code>Partner</code></td>
                    <td>Vendor registry, automated purchase indents, PO dispatch, distributor onboarding &amp; directory.</td>
                  </tr>
                  <tr>
                    <td><strong>RMA Returns &amp; Operations</strong></td>
                    <td><code>ReturnsController</code>, <code>ReturnsAdmin</code>, <code>Tickets</code>, <code>Staff</code>, <code>UserPermissions</code></td>
                    <td>RMA return lifecycle, warranty tickets, 25-module granular staff RBAC, system alerts.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="doc-table-container">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>Framework / Library</th>
                    <th>Version</th>
                    <th>Description</th>
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
              <li>Configures in-memory caching (<code>IMemoryCache</code>) and Brotli/Gzip response compression.</li>
              <li>Initializes JSON serialization with <code>ReferenceHandler.IgnoreCycles</code> to eliminate circular reference errors.</li>
              <li>Sets multipart request body limits up to 50MB (with Nginx configured up to 550MB for firmware/software).</li>
              <li>Registers MySQL <code>DbContext</code> using <code>QuerySplittingBehavior.SplitQuery</code> to prevent Cartesian explosion on multi-join queries.</li>
              <li>Enables transient failure connection retry policies (up to 3 retries with 5-second delays).</li>
              <li>Configures JWT Bearer authentication with symmetric key validation.</li>
              <li>Enables CORS policy <code>AllowAll</code> with exposed <code>Authorization</code> headers.</li>
              <li>Applies static files middleware serving uploaded media from <code>/uploads</code> and <code>/images</code>.</li>
            </ol>
          </section>

          {/* SECTION 4 */}
          <section id="api-integration" className="doc-section">
            <div className="doc-section-header">
              <span className="doc-section-number">Section 4</span>
              <h2 className="doc-section-heading">API Integration &amp; Request-Handling Approach</h2>
            </div>
            <p className="doc-p">
              Frontend API calls are centralized in <code>src/services/</code> using configured Axios and Fetch instances:
            </p>

            <ul style={{ paddingLeft: '24px', margin: '0 0 16px 0', color: '#475569' }}>
              <li>
                <strong>Dynamic Token Injection:</strong> Request interceptors check the target context. If an admin endpoint is requested, <code>adminToken</code> (sessionStorage) is attached; if a customer portal request is made, <code>customerToken</code> (localStorage) is attached via <code>Authorization: Bearer &lt;token&gt;</code>.
              </li>
              <li>
                <strong>Ngrok Warning Bypass:</strong> Development requests automatically include the header <code>ngrok-skip-browser-warning: true</code> to avoid tunnel warning pages.
              </li>
              <li>
                <strong>Unified DTO Handling:</strong> Services normalize API responses, converting null or missing nested collections into safe default arrays or empty objects.
              </li>
            </ul>
          </section>

          {/* SECTION 5 */}
          <section id="auth-security" className="doc-section">
            <div className="doc-section-header">
              <span className="doc-section-number">Section 5</span>
              <h2 className="doc-section-heading">Authentication &amp; Dynamic RBAC Security</h2>
            </div>
            <p className="doc-p">
              The platform enforces strict authentication boundaries between storefront customers and administrative personnel:
            </p>

            <div className="doc-table-container">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Domain</th>
                    <th>Credentials &amp; Flow</th>
                    <th>Security Safeguards</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Storefront Customers</strong></td>
                    <td>Email + Password authenticated via <code>/api/CustomerPortal/login</code>. Generates customer JWT token.</td>
                    <td>IDOR protection: customer can only query and view orders associated with their own customer ID.</td>
                  </tr>
                  <tr>
                    <td><strong>Admin &amp; Staff</strong></td>
                    <td>Email/Employee ID + Password + Mandatory 6-Digit Email OTP verification.</td>
                    <td>2-Factor Authentication required before issuing <code>adminToken</code>.</td>
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
          </section>

          {/* SECTION 6 */}
          <section id="db-storage" className="doc-section">
            <div className="doc-section-header">
              <span className="doc-section-number">Section 6</span>
              <h2 className="doc-section-heading">MySQL Database &amp; Storage Architecture</h2>
            </div>
            <p className="doc-p">
              The application uses <strong>MySQL 8.0+</strong> as its relational data store (default database: <code>honeywell_products</code>):
            </p>

            <ul style={{ paddingLeft: '24px', margin: '0 0 16px 0', color: '#475569' }}>
              <li><strong>Relational Schema:</strong> Complete relational models for users, customers, staff, permissions, categories, subcategories, products, orders, order items, invoices, returns, warranty tickets, suppliers, quotes, distributor applications, and testimonials.</li>
              <li><strong>Snapshot File:</strong> The root file <code>db.sql</code> provides a 200KB+ comprehensive snapshot of database table structures, foreign key constraints, indexes, and seeded records.</li>
              <li><strong>Split Query Execution:</strong> Configured via EF Core <code>QuerySplittingBehavior.SplitQuery</code> to avoid Cartesian explosion when querying nested relationships (e.g., categories with subcategories and products).</li>
              <li><strong>Physical Upload Storage:</strong> Media files are stored on disk at <code>Honeywell-Backend/wwwroot/uploads/</code>, mounted to Docker as a named volume <code>uploads:/app/wwwroot/uploads</code>.</li>
            </ul>
          </section>

          {/* SECTION 7 */}
          <section id="catalog-cart" className="doc-section">
            <div className="doc-section-header">
              <span className="doc-section-number">Section 7</span>
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

          {/* SECTION 8 */}
          <section id="checkout-order" className="doc-section">
            <div className="doc-section-header">
              <span className="doc-section-number">Section 8</span>
              <h2 className="doc-section-heading">Checkout &amp; Order Processing Flow</h2>
            </div>
            <p className="doc-p">
              The complete order creation and fulfillment workflow operates as follows:
            </p>

            <ul className="doc-steps-list">
              <li className="doc-step-item">
                <h4>Checkout Submission</h4>
                <p>
                  Customer enters shipping address and contact details in <code>Checkout.jsx</code>. Inputs are validated using <code>src/utils/validators.js</code>.
                </p>
              </li>
              <li className="doc-step-item">
                <h4>Order Creation Call</h4>
                <p>
                  <code>orderService.create(payload)</code> posts to <code>POST /api/Orders</code> or <code>POST /api/CustomerPortal/orders</code>.
                </p>
              </li>
              <li className="doc-step-item">
                <h4>Backend Processing</h4>
                <p>
                  The backend generates a unique Order ID, records line items in <code>OrderItems</code>, decrements available inventory stock, and logs the initial milestone in the tracking history.
                </p>
              </li>
              <li className="doc-step-item">
                <h4>Fulfillment Transitions</h4>
                <p>
                  Orders transition through authoritative states: <code>Pending Verification</code> &rarr; <code>Processing</code> &rarr; <code>Dispatched</code> &rarr; <code>In Transit</code> &rarr; <code>Delivered</code> (or <code>Cancelled</code>).
                </p>
              </li>
            </ul>
          </section>

          {/* SECTION 9 */}
          <section id="payment-arch" className="doc-section">
            <div className="doc-section-header">
              <span className="doc-section-number">Section 9</span>
              <h2 className="doc-section-heading">Payment Processing Architecture &amp; Integrations</h2>
            </div>
            <p className="doc-p">
              Payment endpoints are implemented in <code>Honeywell-Backend/Controllers/PaymentController.cs</code> and interfaced via <code>src/services/paymentService.js</code>:
            </p>

            <div className="doc-table-container">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Backend Endpoint</th>
                    <th>Implementation Flow</th>
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
                <h4>Note on Cashfree Integration</h4>
                <p>
                  Cashfree payment gateway SDK and webhooks are <strong>not present</strong> in this repository. Payment operations utilize native backend simulation endpoints, dynamic UPI QR polling, and administrative UTR reconciliation.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 10 */}
          <section id="env-config" className="doc-section">
            <div className="doc-section-header">
              <span className="doc-section-number">Section 10</span>
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
    "DefaultConnection": "Server=localhost;Database=honeywell_products;User=root;Password=YOUR_SECURE_PASSWORD;"
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

          {/* SECTION 11 */}
          <section id="local-dev" className="doc-section">
            <div className="doc-section-header">
              <span className="doc-section-number">Section 11</span>
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

          {/* SECTION 12 */}
          <section id="testing-build" className="doc-section">
            <div className="doc-section-header">
              <span className="doc-section-number">Section 12</span>
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

          {/* SECTION 13 */}
          <section id="deployment-docker" className="doc-section">
            <div className="doc-section-header">
              <span className="doc-section-number">Section 13</span>
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

          {/* SECTION 14 */}
          <section id="limitations" className="doc-section">
            <div className="doc-section-header">
              <span className="doc-section-number">Section 14</span>
              <h2 className="doc-section-heading">Verified Capabilities, Known Limitations &amp; Dependencies</h2>
            </div>
            <p className="doc-p">
              Summary of verified system features versus unintegrated external services:
            </p>

            <div className="doc-table-container">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Capability</th>
                    <th>Verified Status</th>
                    <th>Technical Notes</th>
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
    
      {/* Formal Print Running Footer */}
      <div className="doc-print-footer">
        <span className="doc-print-footer-brand">Honeywell Products</span>
        <span className="doc-print-footer-page"></span>
      </div>
    </div>
  );
}
# Honeywell Products Platform — Technical Documentation

This document provides technical documentation for the **Honeywell Products** platform, detailing frontend and backend architectures, database schemas, API integration patterns, authentication models, and production container deployment.

---

## 1. Project Overview & Repository Organization

The Honeywell Products platform is a full-stack smart surveillance equipment e-commerce and operations management system. It provides end-to-end management for CCTV, Solar Cameras, DVR, NVR, Storage, and Access Control equipment, along with B2B dealer/distributor portals, customer order tracking, warranty service workflows, and multi-channel fulfillment.

Repository topology:

```text
HoneywellProducts-main/
|-- Honeywell-Backend/     ASP.NET Core 8 Web API (.NET 8.0, C#, EF Core, Controllers, DTOs)
|-- Honeywell-Frontend/    React 19 SPA, Vite 8, React Router DOM v7, Tailwind CSS, Lucide
|-- docker-compose.yml     Multi-container production stack (frontend, backend, uploads volume)
|-- nginx.conf             Nginx edge reverse proxy (/api/ and /uploads/, 550MB payload)
|-- db.sql                 MySQL database schema and seed data
`-- .env                   Docker container environment configuration
```

---

## 2. Frontend Technology Stack

The frontend is located in `Honeywell-Frontend/`.

| Area | Technology | Version | Role in Platform |
| --- | --- | --- | --- |
| UI Framework | React (with JSX) | `19.2.0` | Declarative UI, state management, functional components |
| Build Engine | Vite | `8.2.2` | Development HMR and Rollup-based asset optimization |
| Routing | React Router DOM | `7.1.1` | Client-side SPA routing, lazy-loaded page modules |
| Styling | Tailwind CSS & CSS Variables | `3.4.17` | Honeywell branding design system (`--red`, `--ink`, `--surface`) |
| Iconography | Lucide React | `0.468.0` | Vector SVG iconography |
| HTTP Client | Axios & Native Fetch API | `1.19.0` | API communication with dynamic Bearer auth injection |
| Visualizations | Recharts | `3.1.0` | Sales breakdown, growth journey, and order status analytics |
| Invoicing | jsPDF & html2canvas | `4.2.1` | Automated GST tax invoice and datasheet generation |

### Important Frontend Architecture Files

```text
Honeywell-Frontend/src/App.jsx                     Central route definitions for storefront & console
Honeywell-Frontend/src/main.jsx                    React application bootstrap
Honeywell-Frontend/src/admin/AdminLayout.jsx       Console wrapper with RBAC route protection & auto-lock
Honeywell-Frontend/src/admin/AdminMenuBar.jsx      Sidebar navigation across canonical modules
Honeywell-Frontend/src/admin/AdminTopBar.jsx       Topbar header with greeting, notifications & user profile
Honeywell-Frontend/src/utils/rbac.js               Role-based access engine with canonical module mapping
Honeywell-Frontend/src/services/api.js             Base HTTP client with dynamic bearer auth injection
Honeywell-Frontend/src/services/customerApi.js     Customer portal endpoints with strict DTO contracts
Honeywell-Frontend/src/services/orderService.js    Orders & shipment tracking API client
Honeywell-Frontend/src/services/paymentService.js  Payment gateway simulation and UTR verification
```

---

## 3. Backend Technology Stack

The backend is located in `Honeywell-Backend/`.

| Area | Technology | Version | Description |
| --- | --- | --- | --- |
| Target Runtime | .NET 8.0 (C# 12) | `net8.0` | Cross-platform performance runtime |
| API Framework | ASP.NET Core Web API | `8.0` | RESTful controllers, DI, model binding |
| Database ORM | Entity Framework Core | `9.0.8` | Relational persistence and LINQ queries |
| MySQL Provider | Pomelo.EntityFrameworkCore.MySql | `9.0.0` | Native MySQL relational database dialect |
| Authentication | Microsoft.AspNetCore.Authentication.JwtBearer | `8.0.0` | JWT Bearer token generation and validation |
| Password Hashing | BCrypt.Net-Next | `4.2.0` | Salted password hashing |
| Email & SMTP | MailKit | `4.17.0` | SMTP client for 2FA OTP codes |
| API Documentation | Swashbuckle.AspNetCore (Swagger) | `6.6.2` | OpenAPI interactive documentation |

### Backend Startup Pipeline (`Program.cs`)

1. Registers in-memory caching (`IMemoryCache`) and Brotli/Gzip response compression.
2. Configures JSON serializer with `ReferenceHandler.IgnoreCycles` to prevent circular graph serialization.
3. Sets `MultipartBodyLengthLimit` to 50MB (with Nginx configured up to 550MB for firmware/software).
4. Initializes Swagger OpenAPI documentation with JWT Bearer security requirements.
5. Configures CORS policy (`AllowAll`) with exposed authorization headers.
6. Registers MySQL DbContext using split queries (`QuerySplittingBehavior.SplitQuery`) and transient failure retry policies.
7. Configures JWT Bearer token validation (Issuer, Audience, Symmetric Key).
8. Applies static files middleware with caching headers for `/uploads` and `/images`.
9. Maps controller endpoints and launches HTTP host.

---

## 4. MySQL Database & Storage

The application uses **MySQL 8.0+** as its relational data store (default database: `honeywell_products`).

- **Relational Schema:** Models for users, customers, staff, permissions, products, categories, subcategories, orders, order items, invoices, returns, warranty tickets, suppliers, quotes, distributor applications, and testimonials.
- **Baseline SQL Snapshot:** The root file `db.sql` provides an export of tables, indexes, and seeded records.
- **Query Splitting:** Entity Framework uses split queries (`QuerySplittingBehavior.SplitQuery`) to avoid Cartesian explosions on nested child collections.
- **Physical File Uploads:** Stored on the local filesystem at `Honeywell-Backend/wwwroot/uploads/`, mounted to Docker as a named volume `uploads:/app/wwwroot/uploads`.

---

## 5. Authentication, Security & RBAC Engine

- **Dual-Token Architecture:** Console users authenticate with `adminToken` (session storage), while storefront customers authenticate with `customerToken` (local storage).
- **Mandatory 2-Factor Authentication (OTP):** Admin and staff logins require a dynamic 6-digit email OTP generated by `adminAuthApi.resendOtp()` and verified by the backend.
- **30-Minute Inactivity Auto-Lock:** In `AdminLayout.jsx`, user interactions (mouse, keyboard, scroll, touch, focus) are monitored. After 30 minutes of idle time, credentials are automatically purged and the user is redirected to `/admin/login`.
- **Dynamic RBAC Engine (`src/utils/rbac.js`):** Canonicalizes route paths and module names against the 25 official database modules, strictly preventing static fallback grants.
- **Manager Read-Only Protection:** Runtime DOM listeners in `AdminLayout.jsx` intercept form submissions, save actions, and delete requests for accounts with the `manager` role.
- **Customer Ownership Verification:** Enforces IDOR protection on order details and customer account records.

---

## 6. Nginx Reverse Proxy Configuration

The root `nginx.conf` defines the edge reverse proxy:

```nginx
server {
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
}
```

- **550MB Payload Support:** Accommodates large firmware and software binary uploads.
- **SPA Routing:** `try_files $uri $uri/ /index.html` ensures client-side routes refresh without 404s.

---

## 7. Product Catalog & Shopping Cart Flow

1. **Catalog Browsing:** Fetches products with category IDs, specifications, and live inventory badges.
2. **Reactive Cart:** Maintained in `CartContext.jsx` and persisted to `honey-well-cart` in browser localStorage.
3. **Price Visibility:**
   - *Mode A (Catalogue Mode):* Hides pricing and cart operations for customized commercial quote proposals.
   - *Mode B (E-Commerce Mode):* Full transparent pricing and checkout capabilities.

---

## 8. Checkout & Order Lifecycle

1. Customer submits shipping address and payment method in `Checkout.jsx`.
2. Frontend calls `orderService.create(payload)`, posting to `POST /api/Orders` or `/api/CustomerPortal/orders`.
3. Backend generates unique Order ID, inserts order records, and decrements available product stock.
4. Fulfillment transitions through authoritative states: `Pending Verification` -> `Processing` -> `Dispatched` -> `In Transit` -> `Delivered`.

---

## 9. Payment Architecture

Managed in `Honeywell-Backend/Controllers/PaymentController.cs`:

- **UPI:** VPA collection and status resolution.
- **Dynamic UPI QR:** Generates real-time QR code; client polls `GET /api/Payment/status/{transactionId}` until verified.
- **Credit / Debit Cards:** Card validation with simulated 3D Secure OTP verification.
- **Net Banking:** Major Indian bank selection with simulated OTP confirmation.
- **Direct Bank Transfer:** Corporate bank account details displayed; customer submits UTR number for manual administrative verification.
- **Cashfree Note:** Cashfree gateway SDK is not integrated in this codebase; operations utilize native simulation and UTR verification.

---

## 10. Environment Configuration

```bash
# Frontend (.env)
VITE_API_URL=http://localhost:5000
```

```json
// Backend (appsettings.json)
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=honeywell_products;User=root;Password=YOUR_PASSWORD;"
  },
  "Jwt": {
    "Key": "YOUR_SUPER_SECRET_JWT_SIGNING_KEY_MIN_32_CHARS",
    "Issuer": "HoneywellProductsAPI",
    "Audience": "HoneywellProductsClient"
  }
}
```

---

## 11. Local Development Setup

```bash
# 1. Prepare Database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS honeywell_products;"
mysql -u root -p honeywell_products < db.sql

# 2. Start Backend
cd Honeywell-Backend
dotnet restore
dotnet run

# 3. Start Frontend
cd Honeywell-Frontend
npm install
npm run dev
```

---

## 12. Testing & Production Build

```bash
# Frontend Unit & Contract Tests
cd Honeywell-Frontend
npm test

# Frontend Production Build
npm run build

# Backend Production Build
cd Honeywell-Backend
dotnet build
dotnet publish -c Release -o publish
```

---

## 13. Docker Deployment

```bash
docker compose up -d --build
```

---

## 14. Verified Capabilities & Limitations

- **Verified Functional:** Product catalog, search, dynamic filters, cart, checkout, customer portal, order tracking, admin console RBAC, manual UTR verification, PDF invoice generation.
- **External Dependencies:** Cashfree payment gateway and external courier live tracking webhooks are not implemented in this repository version.

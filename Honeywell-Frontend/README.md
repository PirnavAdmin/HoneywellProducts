# HONEYWELL PRODUCTS Frontend

A production-buildable React + Vite frontend for a scalable security-product catalogue, security-solutions website, B2C cart-preparation flow, B2B bulk-enquiry experience, and dealer/distributor partner platform.

The project is frontend-only. Forms use local mock services and do not transmit information to a backend.

## Technology

- React 19 and Vite
- JavaScript and React Router
- Modern responsive CSS
- Lucide React icons
- Recharts for the demo growth visualization
- React Context for the local cart and shared enquiry UI

## Install and run

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Production build

```bash
npm run build
```

The optimized output is created in `dist/`.

Optional code-quality check:

```bash
npm run lint
```

## Routes

- `/` — three-slide hero, 13 categories, featured/new/popular products, applications, solutions, partner callout, mock testimonials, demo chart, trends and final CTA
- `/products` — searchable catalogue with category, installation, connectivity and feature filters
- `/products/:id` — gallery, highlights, enquiry, bulk quote, cart, product tabs, downloads placeholders and FAQ
- `/solutions` — application finder and six security-solution starting points
- `/business` — distributor, dealer, reseller, installer, integrator, channel partner, franchise and career content plus partner application
- `/about-us` — company, vision, mission, portfolio, conservative differentiators and CEO Corner placeholders
- `/contact` — validated product, sales, dealer, distributor and support enquiry form
- `/cart` — add, remove, increase, decrease and clear local cart items
- `/checkout` — frontend-only contact and delivery request
- `/order-success` — local cart-request confirmation

## Structure

```text
src/
  assets/images/       Supplied and project visuals
  components/          Layout, shared UI, forms, home, products and chatbot
  config/              Company/contact and social link configuration
  context/             Cart and shared enquiry/quote state
  data/                Products, categories, solutions, testimonials, trends and chart data
  hooks/               Document metadata helper
  pages/               Route-level screens
  services/            Mock service boundaries for future REST endpoints
  styles/              Design tokens and responsive global styles
```

## Mock data notice

Product models, specifications, availability, downloads, testimonials and growth values are explicitly marked as demo or client placeholders. Do not publish them as verified company information.

Key source comments include:

- `// DEMO PRODUCT DATA - Replace with client verified specifications`
- `// DEMO TESTIMONIAL DATA - Replace with client approved testimonials`
- `// DEMO GROWTH DATA - Replace with client supplied figures`

## Replace logo and images

- Primary logo: `public/honeywell-products-logo.png`
- Social preview: `public/og.png`
- Hero and site imagery: `src/assets/images/`
- CEO placeholder path prepared in `src/pages/About.jsx`: `/images/ceo-placeholder.jpg`

Keep replacement image proportions intact and use optimized web assets before launch.

## Configure contact and social links

- Edit placeholders in `src/config/siteConfig.js`.
- Add only official Facebook, Instagram, LinkedIn, YouTube and WhatsApp URLs in `src/config/socialLinks.js`.
- Empty social URLs remain disabled and the WhatsApp button does not navigate.

## Configure the future API

Copy `.env.example` to `.env.local` and update:

```text
VITE_API_BASE_URL=https://honeywellproducts.com
```

The value is centralized in `src/services/api.js`; do not place API URLs throughout components. Never store secrets in Vite environment variables because frontend values are public.

## Future ASP.NET Core integration

The service layer is prepared for these REST routes:

```text
GET  /api/products
GET  /api/products/{id}
GET  /api/categories
POST /api/enquiries
POST /api/bulk-quotes
POST /api/contact
POST /api/partner-applications
POST /api/chat
```

Replace each mock service implementation with `apiRequest` calls when the ASP.NET Core Web API, Entity Framework Core and PostgreSQL or SQL Server backend is available.

## Client data still required

- Official company overview, mission and vision
- CEO name, designation, photograph and message
- Verified product models, specifications, images, availability, downloads and warranty information
- Official social and WhatsApp URLs
- Approved testimonials and video assets
- Verified growth figures
- Approved legal-policy content

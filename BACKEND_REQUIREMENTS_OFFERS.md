# BACKEND REQUIREMENTS REPORT: OFFERS & MARKETING CAMPAIGNS

**Target Component:** Admin > Marketing Campaign > Create / Edit Offer Builder  
**Date:** September 16, 2026  
**Scope:** Frontend Gap Analysis & Backend API Specification  

---

## 1. Executive Summary

The frontend has been upgraded to a **Product-Linked Offer & Deal Builder**.  
While the frontend UI provides a complete set of features (Deal Type, Cascading Product Selection, Savings Calculations, Campaign Start/End Times, Display Settings, and Live Customer Previews), the existing backend Offer API accepts only a subset of these fields.

To prevent runtime errors or database corruption, **the frontend currently sends ONLY the fields supported by the backend API**. Non-supported UI fields are maintained in frontend component state and visual previews.

This report specifies the exact backend schema enhancements, payload contracts, and endpoint improvements required to make all advanced features fully persistent.

---

## 2. Current Backend API Capabilities

The existing backend Offer API (`/api/Offers`) currently supports:

| Field Name | Type | Current Status | Description |
| :--- | :--- | :--- | :--- |
| `id` | `int / string` | Supported | Primary key of the offer |
| `title` | `string` | Supported | Title of the offer / campaign |
| `category` | `string` | Supported | Category name associated with the offer |
| `badgeTag` | `string` | Supported | Promotional badge (e.g., "25% OFF", "SPECIAL PRICE") |
| `originalPrice` | `decimal / double` | Supported | Regular MRP price |
| `dealPrice` | `decimal / double` | Supported | Offer / discounted selling price |
| `discountPercentage` | `decimal / int` | Supported | Calculated percentage discount |
| `description` | `string` | Supported | Detailed description / terms |
| `imageUrl` | `string` | Supported | Banner or product image URL |
| `endDate` | `string (ISO Date)` | Supported | Campaign expiry timestamp (`YYYY-MM-DDTHH:mm:ssZ`) |
| `isActive` | `boolean` | Supported | Visibility status on customer store |
| `displayOrder` | `int` | Supported | Sequence number for sorting offers |
| `productId` | `int / null` | Supported | Optional foreign key pointing to `Products.Id` |

---

## 3. Missing Backend Fields & Functional Gaps

The following fields are present in the frontend UI builder but are **NOT supported by the backend API**:

### 3.1. Campaign Deal Types (`dealType`)
- **Missing Property:** `dealType` (`string` or `enum`)
- **Allowed Values:** `'Product Offer'`, `'Category Offer'`, `'Flash Deal'`, `'Featured Deal'`
- **Current Behavior:** The frontend defaults to `'Product Offer'`, but the value is not stored in the database.
- **Backend Requirement:** Add `DealType` column to `Offers` table and include in `GET`, `POST`, `PUT` DTOs.

### 3.2. Subcategory Association (`subcategoryId`)
- **Missing Property:** `subcategoryId` (`int?`)
- **Current Behavior:** The frontend supports cascading Category -> Subcategory -> Product selection. Only `productId` and `category` are saved.
- **Backend Requirement:** Add `SubcategoryId` foreign key pointing to `Subcategories.Id`.

### 3.3. Campaign Start Date & Time (`startDate`, `startTime`)
- **Missing Property:** `startDate` (`DateTime?` / `string`)
- **Current Behavior:** The backend only stores `endDate`. Offers become active immediately upon creation.
- **Backend Requirement:** Add `StartDate` column so marketing campaigns can be scheduled for future launch.

### 3.4. Advanced Display & Marketing Toggles
- **Missing Properties:**
  - `isFeatured` (`boolean`) -> Highlight deal in featured banner slots on Homepage.
  - `showDiscountBadge` (`boolean`) -> Toggle badge visibility on offer cards.
  - `showCountdownTimer` (`boolean`) -> Toggle live expiry countdown timer widget.
  - `imageSource` (`string`) -> Flag indicating whether offer uses linked product image or custom banner upload.
- **Backend Requirement:** Add corresponding columns to `Offers` table.

---

## 4. Recommended Backend API Contracts

### 4.1. `POST /api/Offers` (Create Offer)
**Recommended Request Body:**
```json
{
  "title": "Honeywell 100W Foldable Solar Panel Deal",
  "dealType": "Product Offer",
  "category": "Solar panels",
  "categoryId": 3,
  "subcategoryId": 12,
  "productId": 45,
  "badgeTag": "25% OFF",
  "description": "Exclusive 25% discount on high-efficiency foldable solar panels.",
  "originalPrice": 11999.00,
  "dealPrice": 8999.00,
  "discountPercentage": 25,
  "imageSource": "product",
  "imageUrl": "/uploads/products/solar-panel-100w.jpg",
  "startDate": "2026-09-16T09:00:00Z",
  "endDate": "2026-10-16T23:59:59Z",
  "displayOrder": 1,
  "isActive": true,
  "isFeatured": true,
  "showDiscountBadge": true,
  "showCountdownTimer": true
}
```

### 4.2. `PUT /api/Offers/{id}` (Update Offer)
Same structure as `POST`, with `id` included.

### 4.3. `GET /api/Offers` & `GET /api/Offers/admin` (Response Body)
Should include the expanded `OfferDto` along with nested `Product` object if `productId` is non-null:
```json
{
  "id": 1,
  "title": "Honeywell 100W Foldable Solar Panel Deal",
  "dealType": "Product Offer",
  "category": "Solar panels",
  "categoryId": 3,
  "subcategoryId": 12,
  "productId": 45,
  "badgeTag": "25% OFF",
  "originalPrice": 11999.00,
  "dealPrice": 8999.00,
  "discountPercentage": 25,
  "description": "Exclusive 25% discount on high-efficiency foldable solar panels.",
  "imageUrl": "/uploads/products/solar-panel-100w.jpg",
  "startDate": "2026-09-16T09:00:00Z",
  "endDate": "2026-10-16T23:59:59Z",
  "displayOrder": 1,
  "isActive": true,
  "isFeatured": true,
  "showDiscountBadge": true,
  "showCountdownTimer": true,
  "product": {
    "id": 45,
    "name": "Honeywell 100W Foldable Solar Panel",
    "sku": "HON-SOL-100W",
    "brand": "Honeywell",
    "price": 8999.00,
    "mrp": 11999.00,
    "stock": 15,
    "imageUrl": "/uploads/products/solar-panel-100w.jpg"
  }
}
```

---

## 5. Backward Compatibility Requirements

1. **Legacy Offers (Without `productId`):**
   - Older offers created before product-linking was introduced must remain fully functional.
   - When `productId` is `null` or missing, the frontend displays the offer using fallback fields (`title`, `imageUrl`, `category`).
2. **Nullable Fields:**
   - All newly added fields (`dealType`, `subcategoryId`, `startDate`, `isFeatured`, `showCountdownTimer`) must be nullable or have safe defaults in database migrations.

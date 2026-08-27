import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { CartProvider } from './context/CartContext';
import { UIProvider } from './context/UIContext';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Solutions = lazy(() => import('./pages/Solutions'));
const Business = lazy(() => import('./pages/Business'));
const Contact = lazy(() => import('./pages/Contact'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const AdminLoginPage = lazy(() => import('./admin/AdminLoginPage'));
const AdminForgotPassword = lazy(() => import('./admin/AdminForgotPassword'));
const AdminVerifyOtp = lazy(() => import('./admin/AdminVerifyOTP'));
const AdminDashboard = lazy(() => import('./admin/dashboard/AdminDashboard'));
const CategoriesList = lazy(() => import('./admin/catalog/CategoriesList'));
const Category = lazy(() => import('./admin/catalog/Category'));
const SubcategoriesList = lazy(() => import('./admin/catalog/SubcategoriesList'));
const SubcategoryForm = lazy(() => import('./admin/catalog/SubcategoryForm'));
const ProductsList = lazy(() => import('./admin/catalog/ProductsList'));
const ProductsForm = lazy(() => import('./admin/catalog/ProductsForm'));
const ProductFeatures = lazy(() => import('./admin/catalog/ProductFeatures'));
const ProductReviews = lazy(() => import('./admin/catalog/ProductReviews'));
const CustomersList = lazy(() => import('./admin/customers/CustomersList'));
const Customer = lazy(() => import('./admin/customers/Customer'));
const CallHistoryScreen = lazy(() => import('./admin/screens/CallHistoryScreen'));
const ReportsScreen = lazy(() => import('./admin/reports/ReportsScreen'));
const TicketsScreen = lazy(() => import('./admin/tickets/TicketsScreen'));
const OrdersLedger = lazy(() => import('./admin/orders/OrdersLedger'));
const TrackingOrder = lazy(() => import('./admin/orders/TrackingOrder'));
const ShippingOrder = lazy(() => import('./admin/orders/ShippingOrder'));
const AdminReturns = lazy(() => import('./admin/returns/AdminReturns'));
const InvoicesList = lazy(() => import('./admin/invoices/InvoicesList'));
const AddInvoice = lazy(() => import('./admin/invoices/AddInvoice'));
const PaymentHistory = lazy(() => import('./admin/screens/PaymentHistory'));
const StockUpdates = lazy(() => import('./admin/stock/StockUpdates'));
const BannersList = lazy(() => import('./admin/marketing/BannersList'));
const BannerForm = lazy(() => import('./admin/marketing/BannerForm'));
const CouponsList = lazy(() => import('./admin/marketing/CouponsList'));
const Coupon = lazy(() => import('./admin/marketing/Coupon'));
const BrandsList = lazy(() => import('./admin/brands/BrandsList'));
const BrandForm = lazy(() => import('./admin/brands/BrandForm'));
const BlogsList = lazy(() => import('./admin/blogs/BlogsList'));
const BlogForm = lazy(() => import('./admin/blogs/BlogForm'));
const TestimonialsList = lazy(() => import('./admin/testimonials/TestimonialsList'));
const TestimonialForm = lazy(() => import('./admin/testimonials/TestimonialForm'));
const StaffList = lazy(() => import('./admin/staff/StaffList'));
const AddStaff = lazy(() => import('./admin/staff/AddStaff'));
const SuppliersList = lazy(() => import('./admin/suppliers/SuppliersList'));
const NewSuppliersList = lazy(() => import('./admin/suppliers/NewSuppliersList'));
const SuppliersForm = lazy(() => import('./admin/suppliers/SuppliersForm'));
const CoinsConverterScreen = lazy(() => import('./admin/coins/CoinsConverterScreen'));
const FormSettings = lazy(() => import('./admin/settings/FormSettings'));
const TableOfContent = lazy(() => import('./admin/settings/TableOfContent'));
const Users = lazy(() => import('./admin/screens/Users'));
const AdminProfile = lazy(() => import('./admin/screens/AdminProfile'));
const AdminAccountSettings = lazy(() => import('./admin/screens/AdminAccountSettings'));
const ContactCard = lazy(() => import('./admin/screens/ContactCard'));
const FooterConfig = lazy(() => import('./admin/screens/FooterConfig'));
const DescriptionManager = lazy(() => import('./admin/screens/DescriptionManager'));

function LoadingScreen() {
  return <div className="route-loading" role="status"><span /><p>Loading experience…</p></div>;
}

export default function App() {
  return <CartProvider><UIProvider><Suspense fallback={<LoadingScreen />}><Routes>
    <Route path="admin/login" element={<AdminLoginPage />} />
    <Route path="admin/forgot-password" element={<AdminForgotPassword />} />
    <Route path="admin/verify-otp" element={<AdminVerifyOtp />} />
    <Route path="admin" element={<AdminLayout />}>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<AdminDashboard />} />
      <Route path="catalog" element={<Navigate to="categories" replace />} />
      <Route path="catalog/categories" element={<CategoriesList />} />
      <Route path="catalog/category" element={<Category />} />
      <Route path="catalog/subcategories" element={<SubcategoriesList />} />
      <Route path="catalog/subcategory" element={<SubcategoryForm />} />
      <Route path="catalog/products" element={<ProductsList />} />
      <Route path="catalog/products-form" element={<ProductsForm />} />
      <Route path="catalog/product-features" element={<ProductFeatures />} />
      <Route path="catalog/product-reviews" element={<ProductReviews />} />
      <Route path="customers" element={<Navigate to="list" replace />} />
      <Route path="customers/list" element={<CustomersList />} />
      <Route path="customers/customer" element={<Customer />} />
      <Route path="call-history" element={<CallHistoryScreen />} />
      <Route path="reports" element={<ReportsScreen />} />
      <Route path="tickets" element={<TicketsScreen />} />
      <Route path="orders" element={<OrdersLedger />} />
      <Route path="orders/list" element={<OrdersLedger />} />
      <Route path="orders/tracking" element={<TrackingOrder />} />
      <Route path="orders/shipping" element={<ShippingOrder />} />
      <Route path="returns" element={<AdminReturns />} />
      <Route path="invoice" element={<InvoicesList />} />
      <Route path="invoice/add" element={<AddInvoice />} />
      <Route path="payments" element={<PaymentHistory />} />
      <Route path="stock-updates" element={<StockUpdates />} />
      <Route path="marketing" element={<Navigate to="banners" replace />} />
      <Route path="marketing/banners" element={<BannersList />} />
      <Route path="marketing/banner" element={<BannerForm />} />
      <Route path="marketing/coupons" element={<CouponsList />} />
      <Route path="marketing/coupon" element={<Coupon />} />
      <Route path="brands" element={<BrandsList />} />
      <Route path="brands/list" element={<BrandsList />} />
      <Route path="brands/form" element={<BrandForm />} />
      <Route path="blogs" element={<BlogsList />} />
      <Route path="blogs/list" element={<BlogsList />} />
      <Route path="blogs/form" element={<BlogForm />} />
      <Route path="testimonials" element={<TestimonialsList />} />
      <Route path="testimonials/list" element={<TestimonialsList />} />
      <Route path="testimonials/add" element={<TestimonialForm />} />
      <Route path="staff" element={<StaffList />} />
      <Route path="staff/list" element={<StaffList />} />
      <Route path="staff/add" element={<AddStaff />} />
      <Route path="suppliers" element={<SuppliersList />} />
      <Route path="suppliers/list" element={<SuppliersList />} />
      <Route path="suppliers/add" element={<SuppliersForm />} />
      <Route path="suppliers/new" element={<SuppliersForm />} />
      <Route path="suppliers/registrations" element={<NewSuppliersList />} />
      <Route path="coins" element={<CoinsConverterScreen />} />
      <Route path="settings" element={<Navigate to="form" replace />} />
      <Route path="settings/form" element={<FormSettings />} />
      <Route path="settings/toc" element={<TableOfContent />} />
      <Route path="users" element={<Users />} />
      <Route path="profile" element={<AdminProfile />} />
      <Route path="account-settings" element={<AdminAccountSettings />} />
      <Route path="categories" element={<CategoriesList />} />
      <Route path="products" element={<ProductsList />} />
      <Route path="descriptions" element={<DescriptionManager />} />
      <Route path="contact-card" element={<ContactCard />} />
      <Route path="footer" element={<FooterConfig />} />
      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Route>
    <Route element={<Layout />}><Route index element={<Home />} /><Route path="about-us" element={<About />} /><Route path="about" element={<Navigate to="/about-us" replace />} /><Route path="products" element={<Products />} /><Route path="products/:id" element={<ProductDetails />} /><Route path="solutions" element={<Solutions />} /><Route path="business" element={<Business />} /><Route path="contact" element={<Contact />} /><Route path="cart" element={<Cart />} /><Route path="checkout" element={<Checkout />} /><Route path="order-success" element={<OrderSuccess />} /><Route path="*" element={<NotFound />} /></Route>
  </Routes></Suspense></UIProvider></CartProvider>;
}

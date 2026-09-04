import { couponService } from '../../services/couponService';

export async function fetchCoupons() {
  return await couponService.getAll();
}

export async function fetchCouponById(id) {
  return await couponService.getById(id);
}

export async function applyCouponCode(code, cartTotal) {
  return await couponService.applyCoupon(code, cartTotal);
}

export async function createCoupon(coupon) {
  return await couponService.create(coupon);
}

export async function updateCoupon(id, updates) {
  return await couponService.update(id, updates);
}

export async function deleteCoupon(id) {
  return await couponService.delete(id);
}

export async function toggleCouponStatus(id, currentStatus) {
  const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
  return await couponService.update(id, { status: newStatus, isActive: newStatus === 'Active' });
}

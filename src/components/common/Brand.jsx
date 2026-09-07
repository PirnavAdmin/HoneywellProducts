import { Link } from 'react-router-dom';

export default function Brand({ light = false }) {
  return <Link className={`brand ${light ? 'brand-light' : ''}`} to="/" aria-label="HONEYWELL PRODUCTS home"><img src="/honeywell-products-logo.png" alt="HONEYWELL PRODUCTS" /></Link>;
}

import { Link } from 'react-router-dom';

export default function Brand({ light = false, onClick }) {
  const handleClick = (e) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (onClick) onClick(e);
  };

  return (
    <Link
      className={`brand ${light ? 'brand-light' : ''}`}
      to="/"
      onClick={handleClick}
      aria-label="HONEYWELL PRODUCTS home"
    >
      <img src="/honeywell-products-logo.png" alt="HONEYWELL PRODUCTS" />
    </Link>
  );
}

import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Brand({ light = false }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleBrandClick = (e) => {
    if (location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      e.preventDefault();
      navigate('/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <Link
      className={`brand ${light ? 'brand-light' : ''}`}
      to="/"
      onClick={handleBrandClick}
      aria-label="HONEYWELL PRODUCTS home"
    >
      <img src="/honeywell-products-logo.png" alt="HONEYWELL PRODUCTS" />
    </Link>
  );
}

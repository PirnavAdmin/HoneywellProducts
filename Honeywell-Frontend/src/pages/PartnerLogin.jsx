import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Handshake, AlertCircle } from 'lucide-react';
import PageHero from '../components/common/PageHero';
import { partnerService } from '../services/partnerService';
import heroImage from '../assets/images/capital-park2.jpg';

export default function PartnerLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    try {
      const res = await partnerService.login({ email, password });
      if (res && (res.token || res.success || res.id)) {
        localStorage.setItem('partnerToken', res.token || 'partner-session-token');
        localStorage.setItem('partnerEmail', email);
        navigate('/partner/dashboard');
      } else {
        setError(res?.message || 'Partner login failed. Please verify credentials.');
      }
    } catch (err) {
      console.error('Partner login error:', err);
      setError('Backend partner authentication service unavailable. Please contact administrator.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHero
        eyebrow="PARTNER PORTAL"
        title="Partner Account Sign In"
        description="Authorized portal access for Honeywell distributors, dealers, and integrators."
        image={heroImage}
      />

      <section className="section">
        <div className="container">
          <div className="auth-box max-w-md mx-auto">
            <div className="auth-header text-center mb-4">
              <Handshake size={36} className="auth-icon text-primary mx-auto mb-2" />
              <h2>Partner Sign In</h2>
            </div>

            {error && (
              <div className="error-box mb-3">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="auth-form">
              <div className="form-group">
                <label htmlFor="partner-email">Partner Email Address</label>
                <div className="input-with-icon">
                  <Mail size={16} />
                  <input
                    id="partner-email"
                    type="email"
                    required
                    placeholder="partner@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="partner-password">Password</label>
                <div className="input-with-icon">
                  <Lock size={16} />
                  <input
                    id="partner-password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="button button-full" disabled={loading}>
                {loading ? 'Authenticating...' : 'Sign In to Partner Portal'}
              </button>
            </form>

            <div className="auth-footer text-center mt-4">
              <p>Don't have a partner account yet? <Link to="/partner-benefits">Apply for Partner Program</Link></p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

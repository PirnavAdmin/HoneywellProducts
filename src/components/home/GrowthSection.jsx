import { useState, useEffect } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import SectionHeading from '../common/SectionHeading';
import { getGrowthJourney, getGrowthJourneyData } from '../../services/growthJourneyService';

const DEFAULT_METRICS = {
  business: { label: 'Business Growth', suffix: '' },
  products: { label: 'Product Range Growth', suffix: '' },
  customers: { label: 'Customer Network Growth', suffix: '' },
  sales: { label: 'Sales Growth', suffix: '' }
};

export default function GrowthSection() {
  const [metric, setMetric] = useState('business');
  const [data, setData] = useState([]);
  const [metrics, setMetrics] = useState(DEFAULT_METRICS);
  const [eyebrow, setEyebrow] = useState('COMPANY PERFORMANCE');
  const [title, setTitle] = useState('Our Growth Journey');
  const [description, setDescription] = useState('Track our growth indices and performance metrics across key operational sectors over time.');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGrowthData = async () => {
    setLoading(true);
    setError(null);
    try {
      // First fetch full growth journey section model
      const res = await getGrowthJourney();
      
      let fetchedItems = [];
      if (res && typeof res === 'object') {
        // Sanitize eyebrow if backend sends DEMO text
        if (res.eyebrow && !res.eyebrow.toUpperCase().includes('DEMO')) {
          setEyebrow(res.eyebrow);
        } else {
          setEyebrow('COMPANY PERFORMANCE');
        }

        if (res.title) {
          setTitle(res.title);
        }

        // Sanitize description if backend sends DEMO text
        if (res.description && !res.description.toLowerCase().includes('illustrative') && !res.description.toLowerCase().includes('demo')) {
          setDescription(res.description);
        } else {
          setDescription('Track our growth indices and performance metrics across key operational sectors over time.');
        }

        if (res.metrics && typeof res.metrics === 'object' && Object.keys(res.metrics).length > 0) {
          setMetrics(res.metrics);
        }

        if (Array.isArray(res.growthData) && res.growthData.length > 0) {
          fetchedItems = res.growthData;
        }
      }

      // Fallback to /data endpoint if growthData was empty
      if (fetchedItems.length === 0) {
        fetchedItems = await getGrowthJourneyData();
      }

      // Sort logically by year ascending
      const sorted = [...fetchedItems].sort((a, b) => 
        String(a.year).localeCompare(String(b.year), undefined, { numeric: true })
      );

      setData(sorted);
    } catch (err) {
      console.error('Error fetching Growth Journey for homepage:', err);
      // Fallback attempt to get /data endpoint directly
      try {
        const rawData = await getGrowthJourneyData();
        const sorted = [...rawData].sort((a, b) => 
          String(a.year).localeCompare(String(b.year), undefined, { numeric: true })
        );
        setData(sorted);
      } catch (err2) {
        setError('Unable to load Growth Journey data.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrowthData();
  }, []);

  const latest = data.length > 0 ? data.at(-1) : null;
  const currentMetricInfo = metrics[metric] || DEFAULT_METRICS[metric] || { label: metric, suffix: '' };
  const latestValue = latest && latest[metric] !== undefined && latest[metric] !== null ? latest[metric] : '--';
  const latestYear = latest ? latest.year : '';

  return (
    <section className="growth-section">
      <div className="container">
        <div className="growth-intro">
          <SectionHeading 
            eyebrow={eyebrow} 
            title={title} 
            description={description} 
            inverse 
          />
          <div className="growth-tabs" role="tablist" aria-label="Growth metric">
            {Object.entries(metrics).map(([key, value]) => (
              <button 
                key={key} 
                role="tab" 
                aria-selected={metric === key} 
                onClick={() => setMetric(key)} 
                className={metric === key ? 'active' : ''}
              >
                {value.label}
              </button>
            ))}
          </div>
        </div>

        <div className="chart-card">
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#9fb4c2' }}>
              <p>Loading Growth Journey performance data…</p>
            </div>
          ) : error ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#fca5a5' }}>
              <p>{error}</p>
              <button 
                onClick={fetchGrowthData} 
                style={{ 
                  marginTop: '12px', 
                  padding: '8px 16px', 
                  background: '#ef5b62', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: 'pointer' 
                }}
              >
                Retry
              </button>
            </div>
          ) : data.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#9fb4c2' }}>
              <p>No Growth Journey data available.</p>
            </div>
          ) : (
            <>
              <div className="chart-summary">
                <span>{latestYear ? `${latestYear} LATEST INDEX` : 'LATEST INDEX'}</span>
                <strong>{latestValue}{currentMetricInfo.suffix}</strong>
                <small>{currentMetricInfo.label}</small>
              </div>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: -18 }}>
                    <defs>
                      <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f28b24" stopOpacity={0.34} />
                        <stop offset="95%" stopColor="#f28b24" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#355a74" vertical={false} />
                    <XAxis dataKey="year" stroke="#9fb4c2" tickLine={false} axisLine={false} />
                    <YAxis stroke="#9fb4c2" tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: '#0d2a3e', border: '1px solid #355a74', color: '#fff' }} />
                    <Area type="monotone" dataKey={metric} stroke="#f5a33b" strokeWidth={3} fill="url(#growthFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

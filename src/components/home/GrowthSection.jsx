import { useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { growthData } from '../../data/growthData';
import SectionHeading from '../common/SectionHeading';

const metrics = { business: { label: 'Business Growth', suffix: '' }, products: { label: 'Product Range Growth', suffix: '' }, customers: { label: 'Customer Network Growth', suffix: '' }, sales: { label: 'Sales Growth', suffix: '' } };

export default function GrowthSection() {
  const [metric, setMetric] = useState('business');
  const latest = growthData.at(-1);
  return <section className="growth-section"><div className="container"><div className="growth-intro"><SectionHeading eyebrow="DEMO DATA VISUALIZATION" title="Our Growth Journey" description="All values are illustrative growth indices. Replace them with verified client data before representing company performance." inverse /><div className="growth-tabs" role="tablist" aria-label="Growth metric">{Object.entries(metrics).map(([key, value]) => <button key={key} role="tab" aria-selected={metric === key} onClick={() => setMetric(key)} className={metric === key ? 'active' : ''}>{value.label}</button>)}</div></div><div className="chart-card"><div className="chart-summary"><span>2026 demo index</span><strong>{latest[metric]}{metrics[metric].suffix}</strong><small>Demo data only</small></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={growthData} margin={{ top: 12, right: 8, bottom: 0, left: -18 }}><defs><linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f28b24" stopOpacity={0.34}/><stop offset="95%" stopColor="#f28b24" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#355a74" vertical={false} /><XAxis dataKey="year" stroke="#9fb4c2" tickLine={false} axisLine={false} /><YAxis stroke="#9fb4c2" tickLine={false} axisLine={false} /><Tooltip contentStyle={{ background: '#0d2a3e', border: '1px solid #355a74', color: '#fff' }} /><Area type="monotone" dataKey={metric} stroke="#f5a33b" strokeWidth={3} fill="url(#growthFill)" /></AreaChart></ResponsiveContainer></div></div></div></section>;
}

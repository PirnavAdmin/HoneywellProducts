import React, { useState } from 'react';
import { Sun, BatteryCharging, Zap, Info, Wrench } from 'lucide-react';
import { useUI } from '../../context/UIContext';

export default function SolarEstimatorWidget() {
  const { openQuote } = useUI();

  // Inputs
  const [cameraWattage, setCameraWattage] = useState(25); // Watts
  const [autonomyDays, setAutonomyDays] = useState(3); // Days of battery backup

  // Indicative calculations (engineering guidelines: 24h continuous operation, 12V DC system, peak sun hours 4.5h)
  const dailyWattHours = cameraWattage * 24; // Watt-hours per day
  const totalBatteryWh = dailyWattHours * autonomyDays; // Total battery Wh needed
  const batteryAh12V = Math.round(totalBatteryWh / 12); // Ah at 12V DC
  const recommendedSolarWp = Math.round((dailyWattHours * 1.35) / 4.5); // Panel Wp with 35% buffer for losses

  const handleRequestSolarQuote = () => {
    openQuote({
      name: 'Off-Grid Solar Security System Quote',
      solution: 'Solar Solutions & Off-Grid Security',
      description: `Indicative Estimation: ${cameraWattage}W Load, ${autonomyDays} Days Autonomy → Recommended Panel ${recommendedSolarWp}Wp, Battery ${batteryAh12V}Ah (12V).`,
    });
  };

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '16px',
      padding: '28px',
      marginBottom: '32px',
      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fef3c7', color: '#b45309', display: 'grid', placeItems: 'center' }}>
          <Sun size={20} />
        </div>
        <div>
          <p style={{ fontSize: '11px', fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
            INTERACTIVE PLANNING TOOL
          </p>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Indicative Solar Solution Estimator
          </h3>
        </div>
      </div>

      <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, marginBottom: '20px' }}>
        Estimate the indicative solar panel wattage and battery capacity required for continuous off-grid security monitoring based on your load.
      </p>

      {/* Input Form Controls Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
            System Load Power (Watts): <strong>{cameraWattage} W</strong>
          </label>
          <input
            type="range"
            min="10"
            max="120"
            step="5"
            value={cameraWattage}
            onChange={(e) => setCameraWattage(Number(e.target.value))}
            style={{ width: '100%', cursor: 'pointer', accentColor: '#1268a5' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
            <span>10W (Single Camera)</span>
            <span>60W (Multi-Cam NVR)</span>
            <span>120W (High-Power Site)</span>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
            Required Autonomy Backup (Rainy Days): <strong>{autonomyDays} Days</strong>
          </label>
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={autonomyDays}
            onChange={(e) => setAutonomyDays(Number(e.target.value))}
            style={{ width: '100%', cursor: 'pointer', accentColor: '#1268a5' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
            <span>1 Day</span>
            <span>3 Days (Standard)</span>
            <span>5 Days (Heavy Weather)</span>
          </div>
        </div>
      </div>

      {/* Indicative Calculation Output Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', marginBottom: '4px' }}>
            <Sun size={16} />
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>Recommended Solar Panel</span>
          </div>
          <p style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
            {recommendedSolarWp} Wp
          </p>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Indicative PV Panel Capacity</span>
        </div>

        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', marginBottom: '4px' }}>
            <BatteryCharging size={16} />
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>Battery Storage Capacity</span>
          </div>
          <p style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
            {batteryAh12V} Ah <span style={{ fontSize: '14px', color: '#64748b' }}>(~{totalBatteryWh} Wh)</span>
          </p>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Indicative 12V LiFePO4 / Gel Battery</span>
        </div>

        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1268a5', marginBottom: '4px' }}>
            <Zap size={16} />
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>Daily Energy Consumption</span>
          </div>
          <p style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
            {dailyWattHours} Wh / day
          </p>
          <span style={{ fontSize: '11px', color: '#64748b' }}>Based on continuous 24h operational load</span>
        </div>
      </div>

      {/* Explicit Disclaimer Notice */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '12px 16px',
        background: '#eff6ff',
        border: '1px solid #bde0fe',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#1e40af',
        marginBottom: '20px',
      }}>
        <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
        <span>
          <strong>Notice:</strong> This estimator provides an indicative sizing concept for preliminary planning. Final system engineering and component selection require site assessment by our technical sales team.
        </span>
      </div>

      <button className="button" onClick={handleRequestSolarQuote} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
        <Wrench size={16} /> Request Site Assessment &amp; Solar Quote
      </button>
    </div>
  );
}

import React from 'react';
import { ChevronRight } from 'lucide-react';

export default function ArchitectureDiagram({ steps = [], title = 'System Architecture & Topology' }) {
  if (!steps || steps.length === 0) return null;

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '16px',
      padding: '28px',
      marginBottom: '32px',
      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
    }}>
      <div style={{ marginBottom: '20px' }}>
        <p style={{
          fontSize: '11px', fontWeight: 800, color: '#1268a5',
          textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0'
        }}>
          SYSTEM TOPOLOGY
        </p>
        <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
          {title}
        </h3>
      </div>

      {/* Steps Flow Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))`,
        gap: '16px',
        alignItems: 'stretch',
      }}>
        {steps.map((item, idx) => (
          <div key={idx} style={{
            position: 'relative',
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <span style={{
                display: 'inline-block',
                fontSize: '12px',
                fontWeight: 800,
                color: '#1268a5',
                background: '#eff6ff',
                padding: '2px 8px',
                borderRadius: '6px',
                marginBottom: '10px',
              }}>
                STEP {item.step || `0${idx + 1}`}
              </span>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
                {item.title}
              </h4>
              <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                {item.desc}
              </p>
            </div>

            {idx < steps.length - 1 && (
              <div className="diagram-connector-desktop" style={{
                position: 'absolute',
                right: '-12px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 2,
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'grid',
                placeItems: 'center',
                color: '#1268a5',
              }}>
                <ChevronRight size={14} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import {
  Volume2,
  Table,
  Eye,
  BarChart3,
  HelpCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { speechService } from '../services/speechService';
import { audioCueService } from '../services/audioCueService';
import type { DiagramData } from '../types';

interface AccessibleDiagramViewerProps {
  diagram: DiagramData;
}

export default function AccessibleDiagramViewer({ diagram }: AccessibleDiagramViewerProps) {
  const [showTable, setShowTable] = useState(false);
  const [isDescribing, setIsDescribing] = useState(false);

  const handleDescribeAloud = () => {
    audioCueService.select();
    setIsDescribing(true);

    let tableNarration = '';
    if (diagram.dataTable && diagram.dataTable.length > 0) {
      tableNarration =
        ' Data points are: ' +
        diagram.dataTable.map(d => `${d.label}: ${d.value}`).join(', ') +
        '.';
    }

    const narration = `Visual Diagram Description for ${diagram.title}. ${diagram.altDescription}.${tableNarration}`;

    speechService.speak(narration, {
      priority: true,
      onEnd: () => setIsDescribing(false),
    });
  };

  const handleReadTableRow = (label: string, value: string | number) => {
    audioCueService.select();
    speechService.speak(`${label} has a value of ${value}.`, { priority: true });
  };

  return (
    <div
      className="card fade-in"
      style={{
        background: 'var(--bg-card)',
        border: '1.5px solid var(--primary)',
        borderRadius: '0.85rem',
        padding: '1.25rem',
        margin: '0.85rem 0',
        boxShadow: 'var(--shadow-sm)',
      }}
      role="region"
      aria-label={`Visual Diagram: ${diagram.title}. ${diagram.altDescription}`}
    >
      {/* Header with Title and Spoken Trigger */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.6rem',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '0.6rem',
          marginBottom: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: '0.4rem',
              background: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
            }}
          >
            <BarChart3 size={16} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text)' }}>
              {diagram.title}
            </h4>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Accessible Visual & Tactile Diagram Representation
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            onClick={() => setShowTable(t => !t)}
            className="btn-ghost"
            style={{
              fontSize: '0.75rem',
              padding: '0.35rem 0.65rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              border: '1px solid var(--border)',
            }}
            aria-expanded={showTable}
            aria-label="Toggle accessible data table view"
          >
            <Table size={13} />
            <span>{showTable ? 'Hide Table' : 'Audio Data Table'}</span>
            {showTable ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          <button
            onClick={handleDescribeAloud}
            className="btn-primary"
            style={{
              fontSize: '0.75rem',
              padding: '0.35rem 0.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: isDescribing ? '#16A34A' : 'var(--primary)',
            }}
            aria-label="Describe diagram and data aloud"
          >
            <Volume2 size={14} className={isDescribing ? 'mic-pulse' : ''} />
            <span>{isDescribing ? 'Describing…' : 'Describe Aloud (D)'}</span>
          </button>
        </div>
      </div>

      {/* SVG Diagram Visual Canvas */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: '0.6rem',
          border: '1px solid var(--border)',
          padding: '1rem',
          textAlign: 'center',
          overflowX: 'auto',
          marginBottom: '0.85rem',
        }}
      >
        {diagram.svgContent ? (
          <div
            dangerouslySetInnerHTML={{ __html: diagram.svgContent }}
            style={{ display: 'inline-block', maxWidth: '100%' }}
            aria-hidden="true"
          />
        ) : (
          /* Default Accessible High-Contrast Bar Chart Render */
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              gap: '1.5rem',
              height: 160,
              padding: '0.5rem 1rem',
            }}
            aria-hidden="true"
          >
            {diagram.dataTable.map((item, idx) => {
              const num = typeof item.value === 'number' ? item.value : parseFloat(item.value) || 50;
              const maxVal = Math.max(
                ...diagram.dataTable.map(d =>
                  typeof d.value === 'number' ? d.value : parseFloat(d.value) || 100
                )
              );
              const heightPercent = Math.min(100, Math.max(15, (num / maxVal) * 100));
              const colors = ['#2563EB', '#7C3AED', '#059669', '#EA580C', '#D97706'];
              const color = colors[idx % colors.length];

              return (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.4rem',
                    height: '100%',
                    justifyContent: 'flex-end',
                    flex: '0 1 60px',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text)' }}>
                    {item.value}
                  </span>
                  <div
                    style={{
                      width: '100%',
                      height: `${heightPercent}%`,
                      background: color,
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.4s ease',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      textAlign: 'center',
                      lineHeight: 1.2,
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Spoken Alt Description Text Box */}
      <div
        style={{
          background: 'rgba(37,99,235,0.06)',
          borderLeft: '3px solid var(--primary)',
          padding: '0.65rem 0.85rem',
          borderRadius: '0 0.4rem 0.4rem 0',
          fontSize: '0.825rem',
          color: 'var(--text)',
          lineHeight: 1.5,
          marginBottom: showTable ? '0.85rem' : 0,
        }}
      >
        <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem', color: 'var(--primary)' }}>
          <Sparkles size={14} />
          <span>Tactile & Screen Reader Audio Description:</span>
        </div>
        <p style={{ margin: 0, color: 'var(--text)' }}>{diagram.altDescription}</p>
      </div>

      {/* Accessible Data Table (Screen Reader & Keyboard Navigable) */}
      {showTable && (
        <div
          className="fade-in"
          style={{
            marginTop: '0.85rem',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            overflow: 'hidden',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.8rem',
              textAlign: 'left',
            }}
            summary={`Data points for ${diagram.title}`}
          >
            <thead>
              <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '0.6rem 0.85rem', color: 'var(--text)', fontWeight: 800 }}>Category / Variable</th>
                <th style={{ padding: '0.6rem 0.85rem', color: 'var(--text)', fontWeight: 800 }}>Measured Value</th>
                <th style={{ padding: '0.6rem 0.85rem', color: 'var(--text)', fontWeight: 800, textAlign: 'right' }}>Audio Readout</th>
              </tr>
            </thead>
            <tbody>
              {diagram.dataTable.map((row, i) => (
                <tr
                  key={row.label}
                  style={{
                    borderBottom: i < diagram.dataTable.length - 1 ? '1px solid var(--border)' : 'none',
                    background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-surface)',
                  }}
                >
                  <td style={{ padding: '0.55rem 0.85rem', fontWeight: 600, color: 'var(--text)' }}>{row.label}</td>
                  <td style={{ padding: '0.55rem 0.85rem', color: 'var(--text)' }}>{row.value}</td>
                  <td style={{ padding: '0.55rem 0.85rem', textAlign: 'right' }}>
                    <button
                      onClick={() => handleReadTableRow(row.label, row.value)}
                      className="btn-ghost"
                      style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
                      aria-label={`Read row: ${row.label} is ${row.value}`}
                    >
                      <Volume2 size={12} /> Speak
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { ClipboardList, ChevronDown } from 'reicon-react';

interface PipelineStep {
  name: string;
  status: string;
  detail?: string;
  timestamp?: string;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

export function PipelineDropdown({ steps }: { steps: PipelineStep[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const completeCount = steps.filter((s) => s.status === 'complete').length;

  return (
    <div className="pipeline-box" id="pipeline-transparency">
      <div
        className="pipeline-header"
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsOpen(!isOpen); }}
      >
        <div className="pipeline-header-title">
          <ClipboardList size={16} /> AI Editorial Pipeline
          <span className="pipeline-header-badge">Verified</span>
        </div>
        <div className="pipeline-header-meta">
          <span className="pipeline-header-count">
            {completeCount}/{steps.length} steps complete
          </span>
          <ChevronDown
            size={14}
            style={{
              transition: 'transform 0.3s ease',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              color: 'var(--color-dark-gray)',
            }}
          />
        </div>
      </div>
      <div
        className="pipeline-steps-wrapper"
        style={{
          maxHeight: isOpen ? '600px' : '0',
          overflow: 'hidden',
          transition: 'max-height 0.35s ease',
        }}
      >
        <div className="pipeline-steps">
          {steps.map((step, i) => (
            <div className="pipeline-step" key={i}>
              <div className="pipeline-step-indicator"></div>
              <div className="pipeline-step-content">
                <div className="pipeline-step-name">{step.name}</div>
                <div className="pipeline-step-detail">{step.detail}</div>
              </div>
              {step.timestamp && (
                <div className="pipeline-step-time">
                  {formatTime(step.timestamp)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

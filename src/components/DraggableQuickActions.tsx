import React, { useState, useEffect, useRef } from 'react';
import {
  GripVertical,
  Plus,
  Bot,
  UserPlus,
  HelpCircle,
  Volume2,
  X,
  Zap,
} from 'lucide-react';

export interface DraggableQuickActionsProps {
  onCreateExam: () => void;
  onOpenAiGenerator: () => void;
  onGoToStudents: () => void;
  onAddQuestion: () => void;
  onTestVoice: () => void;
}

export const DraggableQuickActions: React.FC<DraggableQuickActionsProps> = ({
  onCreateExam,
  onOpenAiGenerator,
  onGoToStudents,
  onAddQuestion,
  onTestVoice,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Default position at bottom-right (padded from window edge)
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    const saved = localStorage.getItem('sight_exam_quick_actions_pos');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      } catch {}
    }
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;
    return {
      x: Math.max(20, w - 80),
      y: Math.max(70, h - 85),
    };
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0,
    mouseY: 0,
    startX: 0,
    startY: 0,
  });
  const movedRef = useRef(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Clamp button safely within viewport
  const clampPos = (x: number, y: number) => {
    const btnSize = 56;
    const padding = 16;
    const winW = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const winH = typeof window !== 'undefined' ? window.innerHeight : 800;
    const minX = padding;
    const maxX = Math.max(padding, winW - btnSize - padding);
    const minY = 65; // Below navbar
    const maxY = Math.max(minY, winH - btnSize - padding);
    return {
      x: Math.min(Math.max(x, minX), maxX),
      y: Math.min(Math.max(y, minY), maxY),
    };
  };

  // Determine popup placement based on current position on screen
  const winHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const winWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  // If in bottom 60% of viewport, open UPWARDS
  const opensUpward = pos.y > winHeight * 0.45;
  // If in right 50% of viewport, open towards LEFT
  const opensLeftward = pos.x > winWidth * 0.5;

  // Drag logic
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    movedRef.current = false;
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: pos.x,
      startY: pos.y,
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    movedRef.current = false;
    const touch = e.touches[0];
    dragStartRef.current = {
      mouseX: touch.clientX,
      mouseY: touch.clientY,
      startX: pos.x,
      startY: pos.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        movedRef.current = true;
      }
      const newX = dragStartRef.current.startX + dx;
      const newY = dragStartRef.current.startY + dy;
      setPos(clampPos(newX, newY));
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const dx = touch.clientX - dragStartRef.current.mouseX;
      const dy = touch.clientY - dragStartRef.current.mouseY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        movedRef.current = true;
      }
      const newX = dragStartRef.current.startX + dx;
      const newY = dragStartRef.current.startY + dy;
      setPos(clampPos(newX, newY));
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        try {
          localStorage.setItem('sight_exam_quick_actions_pos', JSON.stringify(pos));
        } catch {}
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, pos]);

  // Window resize keeping button on screen
  useEffect(() => {
    const onResize = () => {
      setPos(prev => clampPos(prev.x, prev.y));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggleClick = () => {
    if (!movedRef.current) {
      setIsOpen(prev => !prev);
    }
  };

  return (
    <aside
      ref={widgetRef}
      role="complementary"
      aria-label="Floating Quick Actions"
      style={{
        position: 'fixed',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        zIndex: 9990,
        userSelect: 'none',
      }}
    >
      {/* ── Floating Anchor Button (Always Visible) ── */}
      <button
        type="button"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handleToggleClick}
        title={isOpen ? 'Close Quick Actions' : 'Drag anywhere on screen • Click for Quick Actions'}
        aria-label={isOpen ? 'Close Quick Actions' : 'Open Quick Actions Menu (Draggable)'}
        aria-expanded={isOpen}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: isOpen
            ? 'linear-gradient(135deg, #4338CA 0%, #6D28D9 100%)'
            : 'linear-gradient(135deg, #1E3A8A 0%, #4338CA 50%, #6D28D9 100%)',
          color: '#fff',
          border: '2px solid rgba(255, 255, 255, 0.65)',
          boxShadow: isDragging
            ? '0 16px 36px rgba(30, 58, 138, 0.6), 0 0 0 4px rgba(99, 102, 241, 0.4)'
            : '0 8px 26px rgba(30, 58, 138, 0.45)',
          cursor: isDragging ? 'grabbing' : 'grab',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          touchAction: 'none',
          transition: isDragging ? 'none' : 'transform 0.15s ease, box-shadow 0.2s ease',
          transform: isDragging ? 'scale(1.08)' : 'scale(1)',
        }}
      >
        {isOpen ? (
          <X size={24} color="#fff" />
        ) : (
          <>
            <GripVertical size={13} style={{ opacity: 0.6, marginBottom: -2 }} />
            <Zap size={20} color="#fff" />
            <span
              style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                background: '#10B981',
                color: '#fff',
                fontSize: '0.62rem',
                fontWeight: 800,
                padding: '0.1rem 0.32rem',
                borderRadius: '9999px',
                border: '1.5px solid #fff',
              }}
            >
              Quick
            </span>
          </>
        )}
      </button>

      {/* ── Expanded Quick Actions Dock (Opens into open screen space) ── */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            ...(opensUpward
              ? { bottom: '66px' } // Pops ABOVE the button
              : { top: '66px' }),   // Pops BELOW the button
            ...(opensLeftward
              ? { right: '0px' }    // Aligns to right edge of button
              : { left: '0px' }),   // Aligns to left edge of button
            width: '245px',
            maxHeight: 'calc(100vh - 120px)',
            overflowY: 'auto',
            background: 'var(--bg-surface, #ffffff)',
            borderRadius: '1rem',
            border: '2px solid var(--primary, #4338CA)',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.24), 0 0 0 1px rgba(67, 56, 202, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            animation: opensUpward ? 'fadeInUp 0.18s ease-out' : 'fadeIn 0.18s ease-out',
          }}
        >
          {/* Draggable Header */}
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            style={{
              background: 'linear-gradient(135deg, #1E3A8A 0%, #4338CA 100%)',
              color: '#fff',
              padding: '0.65rem 0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: isDragging ? 'grabbing' : 'grab',
              touchAction: 'none',
            }}
            title="Click and drag to move button anywhere on screen"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '0.86rem' }}>
              <GripVertical size={16} style={{ opacity: 0.85 }} />
              <Zap size={16} color="#FBBF24" />
              <span>Quick Actions</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close Quick Actions"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: '#fff',
                borderRadius: '0.35rem',
                cursor: 'pointer',
                padding: '0.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Sub-label explaining draggability */}
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            style={{
              padding: '0.3rem 0.85rem',
              background: 'rgba(67, 56, 202, 0.06)',
              fontSize: '0.68rem',
              color: 'var(--text-muted, #64748B)',
              borderBottom: '1px solid var(--border, #E2E8F0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
          >
            <span>Drag anywhere on screen</span>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--primary, #4338CA)' }}>Moveable ⠿</span>
          </div>

          {/* Action Buttons List */}
          <div style={{ padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onCreateExam();
              }}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: '0.55rem',
                border: '1px solid var(--border, #E2E8F0)',
                background: 'var(--bg, #F8FAFC)',
                color: 'var(--text, #1E293B)',
                fontWeight: 700,
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(67, 56, 202, 0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg, #F8FAFC)')}
            >
              <div style={{ padding: '0.25rem', borderRadius: '0.35rem', background: '#4338CA', color: '#fff', display: 'flex' }}>
                <Plus size={14} />
              </div>
              <div>
                <div style={{ lineHeight: 1.1 }}>Create Exam</div>
                <span style={{ fontSize: '0.67rem', color: 'var(--text-muted, #64748B)', fontWeight: 500 }}>Schedule new test</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenAiGenerator();
              }}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: '0.55rem',
                border: '1px solid var(--border, #E2E8F0)',
                background: 'var(--bg, #F8FAFC)',
                color: 'var(--text, #1E293B)',
                fontWeight: 700,
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(67, 56, 202, 0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg, #F8FAFC)')}
            >
              <div style={{ padding: '0.25rem', borderRadius: '0.35rem', background: '#7C3AED', color: '#fff', display: 'flex' }}>
                <Bot size={14} />
              </div>
              <div>
                <div style={{ lineHeight: 1.1 }}>AI Generator</div>
                <span style={{ fontSize: '0.67rem', color: 'var(--text-muted, #64748B)', fontWeight: 500 }}>Synthesize questions</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onGoToStudents();
              }}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: '0.55rem',
                border: '1px solid var(--border, #E2E8F0)',
                background: 'var(--bg, #F8FAFC)',
                color: 'var(--text, #1E293B)',
                fontWeight: 700,
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(67, 56, 202, 0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg, #F8FAFC)')}
            >
              <div style={{ padding: '0.25rem', borderRadius: '0.35rem', background: '#059669', color: '#fff', display: 'flex' }}>
                <UserPlus size={14} />
              </div>
              <div>
                <div style={{ lineHeight: 1.1 }}>Students Directory</div>
                <span style={{ fontSize: '0.67rem', color: 'var(--text-muted, #64748B)', fontWeight: 500 }}>PwD Accommodations</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onAddQuestion();
              }}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: '0.55rem',
                border: '1px solid var(--border, #E2E8F0)',
                background: 'var(--bg, #F8FAFC)',
                color: 'var(--text, #1E293B)',
                fontWeight: 700,
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(67, 56, 202, 0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg, #F8FAFC)')}
            >
              <div style={{ padding: '0.25rem', borderRadius: '0.35rem', background: '#D97706', color: '#fff', display: 'flex' }}>
                <HelpCircle size={14} />
              </div>
              <div>
                <div style={{ lineHeight: 1.1 }}>Add Question</div>
                <span style={{ fontSize: '0.67rem', color: 'var(--text-muted, #64748B)', fontWeight: 500 }}>To question bank</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onTestVoice();
              }}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: '0.55rem',
                border: '1px solid var(--border, #E2E8F0)',
                background: 'var(--bg, #F8FAFC)',
                color: 'var(--text, #1E293B)',
                fontWeight: 700,
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(67, 56, 202, 0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg, #F8FAFC)')}
            >
              <div style={{ padding: '0.25rem', borderRadius: '0.35rem', background: '#0284C7', color: '#fff', display: 'flex' }}>
                <Volume2 size={14} />
              </div>
              <div>
                <div style={{ lineHeight: 1.1 }}>Test Voice Audio</div>
                <span style={{ fontSize: '0.67rem', color: 'var(--text-muted, #64748B)', fontWeight: 500 }}>Speech synthesizer</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

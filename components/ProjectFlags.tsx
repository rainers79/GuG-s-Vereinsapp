import React from 'react';

export type ProjectFlagTone = 'project' | 'module' | 'submodule';

export interface ProjectFlagItem {
  id: string;
  label: string;
  tone?: ProjectFlagTone;
  onClick?: () => void;
}

interface Props {
  items: ProjectFlagItem[];
}

const sharedButtonStyle: React.CSSProperties = {
  writingMode: 'vertical-rl',
  transform: 'rotate(180deg)',
  border: 'none',
  boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
  cursor: 'pointer',
  transition: 'transform 0.25s ease',
  pointerEvents: 'auto'
};

const getToneStyle = (tone: ProjectFlagTone): React.CSSProperties => {
  if (tone === 'project') {
    return {
      background: '#C9AE6A',
      color: '#1A1A1A',
      padding: '16px 0px',
      fontWeight: 800,
      borderRadius: '0 10px 10px 0',
      minHeight: '110px',
      width: '30px',
      transform: 'translateX(6px) rotate(180deg)'
    };
  }

  if (tone === 'submodule') {
    return {
      background: '#E9DFC2',
      color: '#1A1A1A',
      padding: '8px 2px',
      fontWeight: 700,
      borderRadius: '0 10px 10px 0',
      minHeight: '68px',
      width: '24px',
      transform: 'translateX(8px) rotate(180deg)'
    };
  }

  return {
    background: '#F5E9D0',
    color: '#1A1A1A',
    padding: '10px 2px',
    fontWeight: 700,
    borderRadius: '0 10px 10px 0',
    minHeight: '80px',
    width: '26px',
    transform: 'translateX(6px) rotate(180deg)'
  };
};

const getHoverTransform = (tone: ProjectFlagTone) => {
  if (tone === 'submodule') {
    return {
      idle: 'translateX(8px) rotate(180deg)',
      active: 'translateX(0px) rotate(180deg)'
    };
  }

  return {
    idle: 'translateX(6px) rotate(180deg)',
    active: 'translateX(0px) rotate(180deg)'
  };
};

const ProjectFlags: React.FC<Props> = ({ items }) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        right: '0',
        top: '132px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        zIndex: 120,
        pointerEvents: 'none'
      }}
    >
      {items.map((item) => {
        const tone = item.tone || 'module';
        const toneStyle = getToneStyle(tone);
        const hoverTransform = getHoverTransform(tone);

        return (
          <button
            key={item.id}
            type="button"
            onClick={item.onClick}
            style={{
              ...sharedButtonStyle,
              ...toneStyle
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = hoverTransform.active;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = hoverTransform.idle;
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
};

export default ProjectFlags;

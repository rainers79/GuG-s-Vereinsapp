import React from 'react';

interface Props {
  projectName: string | null;
  moduleLabel: string | null;
  onProjectClick?: () => void;
  onModuleClick?: () => void;
}

const sharedButtonStyle: React.CSSProperties = {
  writingMode: 'vertical-rl',
  transform: 'rotate(180deg)',
  border: 'none',
  boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
  cursor: 'pointer'
};

const ProjectFlags: React.FC<Props> = ({
  projectName,
  moduleLabel,
  onProjectClick,
  onModuleClick
}) => {
  const showProjectFlag = !!projectName;
  const showModuleFlag = !!moduleLabel && moduleLabel !== projectName;

  if (!showProjectFlag && !showModuleFlag) {
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
        gap: '8px',
        zIndex: 120
      }}
    >
      {showProjectFlag && (
        <button
          type="button"
          onClick={onProjectClick}
          style={{
            ...sharedButtonStyle,
            background: '#C9AE6A',
            color: '#1A1A1A',
            padding: '14px 8px',
            fontWeight: 800,
            borderRadius: '10px 0 0 10px',
            minHeight: '110px'
          }}
        >
          {projectName}
        </button>
      )}

      {showModuleFlag && (
        <button
          type="button"
          onClick={onModuleClick}
          style={{
            ...sharedButtonStyle,
            background: '#F5E9D0',
            color: '#1A1A1A',
            padding: '12px 6px',
            fontWeight: 700,
            borderRadius: '10px 0 0 10px',
            minHeight: '88px'
          }}
        >
          {moduleLabel}
        </button>
      )}
    </div>
  );
};

export default ProjectFlags;

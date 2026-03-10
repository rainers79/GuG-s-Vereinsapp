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
  cursor: 'pointer',
  transition: 'transform 0.25s ease'
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
        gap: '6px',
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
            padding: '12px 6px',
            fontWeight: 800,
            borderRadius: '0 10px 10px 0',
            minHeight: '110px',
            width: '40px',
            transform: 'translateX(6px) rotate(180deg)'
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.transform = 'translateX(0px) rotate(180deg)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.transform = 'translateX(6px) rotate(180deg)')
          }
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
            padding: '10px 4px',
            fontWeight: 700,
            borderRadius: '0 10px 10px 0',
            minHeight: '80px',
            width: '32px',
            transform: 'translateX(6px) rotate(180deg)'
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.transform = 'translateX(0px) rotate(180deg)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.transform = 'translateX(6px) rotate(180deg)')
          }
        >
          {moduleLabel}
        </button>
      )}
    </div>
  );
};

export default ProjectFlags;

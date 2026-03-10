import React from 'react';

interface Props {
  projectName: string | null;
  view: string;
}

const viewLabels: Record<string, string> = {
  'project-chat': 'Chat',
  'project-coreteam': 'Kernteam',
  'project-shopping': 'Einkaufsliste',
  'project-invoices': 'Rechnungen'
};

const ProjectFlags: React.FC<Props> = ({ projectName, view }) => {

  if (!projectName) return null;

  const label = viewLabels[view] || view;

  return (
    <div
      style={{
        position: 'fixed',
        right: '0',
        top: '120px',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}
    >
      <div
        style={{
          background: '#C9AE6A',
          padding: '10px 18px',
          fontWeight: 700,
          borderRadius: '6px 0 0 6px',
          boxShadow: '0 3px 10px rgba(0,0,0,0.2)'
        }}
      >
        {projectName}
      </div>

      <div
        style={{
          background: '#F5E9D0',
          padding: '8px 16px',
          fontWeight: 600,
          borderRadius: '6px 0 0 6px',
          boxShadow: '0 3px 10px rgba(0,0,0,0.2)'
        }}
      >
        {label}
      </div>
    </div>
  );
};

export default ProjectFlags;

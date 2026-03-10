import React from "react";

interface Props {
  projectName: string | null;
  view: string;
  onProjectClick?: () => void;
  onModuleClick?: () => void;
}

const viewLabels: Record<string, string> = {
  "project-chat": "Chat",
  "project-coreteam": "Kernteam",
  "project-shopping": "Einkaufsliste",
  "project-invoices": "Rechnungen"
};

const ProjectFlags: React.FC<Props> = ({
  projectName,
  view,
  onProjectClick,
  onModuleClick
}) => {

  if (!projectName) return null;

  const label = viewLabels[view] || view;

  return (
    <div
      style={{
        position: "fixed",
        right: "0",
        top: "140px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        zIndex: 100
      }}
    >
      <button
        onClick={onProjectClick}
        style={{
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
          background: "#C9AE6A",
          color: "black",
          border: "none",
          padding: "14px 8px",
          fontWeight: 700,
          borderRadius: "10px 0 0 10px",   // Abrundung Richtung Body
          boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
          cursor: "pointer"
        }}
      >
        {projectName}
      </button>

      <button
        onClick={onModuleClick}
        style={{
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
          background: "#F5E9D0",
          color: "black",
          border: "none",
          padding: "12px 6px",
          fontWeight: 600,
          borderRadius: "10px 0 0 10px",   // Abrundung Richtung Body
          boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
          cursor: "pointer"
        }}
      >
        {label}
      </button>
    </div>
  );
};

export default ProjectFlags;

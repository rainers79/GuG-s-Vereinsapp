import React from "react";

interface Props {
  projectName: string | null;
  view: string;
  projects?: string[];
  onProjectClick?: (project: string) => void;
  onModuleClick?: () => void;
}

const viewLabels: Record<string, string> = {
  "project-chat": "Chat",
  "project-coreteam": "Kernteam",
  "project-shopping": "Einkaufsliste",
  "project-invoices": "Rechnungen",
  "tasks": "Aufgaben"
};

const ProjectFlags: React.FC<Props> = ({
  projectName,
  view,
  projects = [],
  onProjectClick,
  onModuleClick
}) => {

  const label = viewLabels[view] || view;

  return (
    <div
      style={{
        position: "fixed",
        right: "0",
        top: "140px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        zIndex: 100
      }}
    >

      {/* PROJEKTMODUS */}
      {projectName && (
        <>
          <button
            onClick={() => onProjectClick?.(projectName)}
            style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              background: "#C9AE6A",
              color: "black",
              border: "none",
              padding: "14px 8px",
              fontWeight: 700,
              borderRadius: "0 10px 10px 0",
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
              borderRadius: "0 10px 10px 0",
              boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
              cursor: "pointer"
            }}
          >
            {label}
          </button>
        </>
      )}

      {/* GLOBALER AUFGABENMODUS */}
      {!projectName && projects.length > 0 &&
        projects.map((p) => (
          <button
            key={p}
            onClick={() => onProjectClick?.(p)}
            style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              background: "#C9AE6A",
              color: "black",
              border: "none",
              padding: "14px 8px",
              fontWeight: 700,
              borderRadius: "0 10px 10px 0",
              boxShadow: "0 3px 10px rgba(0,0,0,0.2)",
              cursor: "pointer"
            }}
          >
            {p}
          </button>
        ))}

    </div>
  );
};

export default ProjectFlags;

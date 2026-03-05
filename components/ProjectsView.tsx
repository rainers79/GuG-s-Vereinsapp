import React from 'react';
import { ViewType } from '../types';

interface Props {
  onNavigate: (view: ViewType) => void;
}

interface WheelItem {
  label: string;
  view?: ViewType;
  comingSoon?: boolean;
}

const items: WheelItem[] = [
  { label: 'Kalender', view: 'calendar' },
  { label: 'Aufgaben', view: 'tasks' },
  { label: 'Umfragen', view: 'polls' },
  { label: 'Rechnungen (coming soon)', comingSoon: true },
  { label: 'Einkaufsliste (coming soon)', comingSoon: true },
  { label: 'Kernteam (coming soon)', comingSoon: true },
  { label: 'Chat Verlauf (coming soon)', comingSoon: true },
  { label: 'Mehr (coming soon)', comingSoon: true }
];

const radius = 180;
const center = 200;

const ProjectsView: React.FC<Props> = ({ onNavigate }) => {

  const createSlice = (index: number, total: number) => {

    const startAngle = (index / total) * 2 * Math.PI;
    const endAngle = ((index + 1) / total) * 2 * Math.PI;

    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);

    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);

    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

    const path = `
      M ${center} ${center}
      L ${x1} ${y1}
      A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
      Z
    `;

    return path;
  };

  const handleClick = (item: WheelItem) => {

    if (item.comingSoon) return;

    if (item.view) {
      onNavigate(item.view);
    }
  };

  return (
    <div className="flex justify-center items-center py-20">

      <div className="relative">

        <svg width="400" height="400">

          {items.map((item, i) => {

            const path = createSlice(i, items.length);

            const midAngle = ((i + 0.5) / items.length) * 2 * Math.PI;

            const textX = center + (radius * 0.6) * Math.cos(midAngle);
            const textY = center + (radius * 0.6) * Math.sin(midAngle);

            return (
              <g
                key={i}
                className={`cursor-pointer transition-transform duration-200 ${
                  item.comingSoon ? 'opacity-40' : 'hover:scale-105'
                }`}
                onClick={() => handleClick(item)}
              >

                <path
                  d={path}
                  fill="#1A1A1A"
                  stroke="#B5A47A"
                  strokeWidth="2"
                />

                <text
                  x={textX}
                  y={textY}
                  fill="#B5A47A"
                  fontSize="12"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{ pointerEvents: 'none' }}
                >
                  {item.label}
                </text>

              </g>
            );
          })}

          <circle
            cx={center}
            cy={center}
            r="60"
            fill="#B5A47A"
          />

          <text
            x={center}
            y={center}
            textAnchor="middle"
            dominantBaseline="middle"
            fontWeight="bold"
            fill="#1A1A1A"
          >
            Projekt
          </text>

        </svg>

      </div>

    </div>
  );
};

export default ProjectsView;

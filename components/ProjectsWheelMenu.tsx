import React from 'react';
import { ViewType } from '../types';

type WheelItem = {
  label: string;
  view?: ViewType;
  comingSoon?: boolean;
  actionKey:
    | 'calendar'
    | 'tasks'
    | 'polls'
    | 'invoices'
    | 'shopping'
    | 'coreteam'
    | 'chatlog'
    | 'more';
};

interface Props {
  wheelItems: WheelItem[];
  hoveredIndex: number | null;
  setHoveredIndex: (i: number | null) => void;
  handleWheelClick: (item: WheelItem) => void;
  wheelColors: string[];
  wheelGroupRef: React.RefObject<SVGGElement>;
  center: number;
  centerRadius: number;
  buttonRadius: number;
  labelRadius: number;
  polarToCartesian: any;
  getSliceLift: any;
  centerLines: string[];
}

const ProjectWheelMenu: React.FC<Props> = ({
  wheelItems,
  hoveredIndex,
  setHoveredIndex,
  handleWheelClick,
  wheelColors,
  wheelGroupRef,
  center,
  centerRadius,
  buttonRadius,
  labelRadius,
  polarToCartesian,
  getSliceLift,
  centerLines
}) => {

  return (
    <div className="flex justify-center items-center py-10">
      <svg width="400" height="400" viewBox="0 0 400 400">

        <defs>
          {wheelColors.map((color, i) => (
            <radialGradient
              key={i}
              id={`grad-${i}`}
              cx="50%"
              cy="30%"
              r="80%"
            >
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="25%" stopColor={color} />
              <stop offset="65%" stopColor={color} />
              <stop offset="100%" stopColor="#00000066" />
            </radialGradient>
          ))}
        </defs>

        <g ref={wheelGroupRef}>

          {wheelItems.map((item, i) => {

            const startAngle = (i / wheelItems.length) * 360;
            const endAngle = ((i + 1) / wheelItems.length) * 360;

            const start = polarToCartesian(center, center, buttonRadius, startAngle);
            const end = polarToCartesian(center, center, buttonRadius, endAngle);

            const largeArc = endAngle - startAngle <= 180 ? 0 : 1;

            const innerStart = polarToCartesian(center, center, centerRadius, startAngle);
            const innerEnd = polarToCartesian(center, center, centerRadius, endAngle);

            const path = `
M ${start.x} ${start.y}
A ${buttonRadius} ${buttonRadius} 0 ${largeArc} 1 ${end.x} ${end.y}
L ${innerEnd.x} ${innerEnd.y}
A ${centerRadius} ${centerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}
Z
`;

            const mid = (startAngle + endAngle) / 2;
            const label = polarToCartesian(center, center, labelRadius, mid);
            const lift = getSliceLift(i, wheelItems.length);

            return (
              <g
                key={i}
                onClick={() => handleWheelClick(item)}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                transform={
                  hoveredIndex === i
                    ? `translate(${lift.dx}, ${lift.dy}) scale(1.05)`
                    : 'scale(1)'
                }
                style={{
                  cursor: item.comingSoon ? 'default' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >

                <path
                  d={path}
                  fill={`url(#grad-${i})`}
                  stroke="none"
                />

                <text
                  x={label.x}
                  y={label.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#000"
                  fontWeight="900"
                  fontSize="13"
                >
                  {item.label}
                </text>

              </g>
            );
          })}

        </g>

        <circle
          cx={center}
          cy={center}
          r={centerRadius}
          fill="#d6c39a"
        />

        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#000"
          fontWeight="900"
          fontSize="14"
        >
          {centerLines.map((line, idx) => (
            <tspan
              key={idx}
              x={center}
              dy={idx === 0 ? -10 : 14}
            >
              {line}
            </tspan>
          ))}
        </text>

      </svg>
    </div>
  );
};

export default ProjectWheelMenu;

import React, { useEffect, useRef } from 'react';
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

interface Point {
  x: number;
  y: number;
}

interface Props {
  wheelItems: WheelItem[];
  hoveredIndex: number | null;
  setHoveredIndex: (i: number | null) => void;
  handleWheelClick: (item: WheelItem) => void;
  wheelColors: string[];
  center: number;
  centerRadius: number;
  buttonRadius: number;
  labelRadius: number;
  polarToCartesian: (
    cx: number,
    cy: number,
    radius: number,
    angleDeg: number
  ) => Point;
  getSliceLift: (index: number, total: number) => { dx: number; dy: number };
  centerLines: string[];
  animationKey: number;
}

const ProjectsWheelMenu: React.FC<Props> = ({
  wheelItems,
  hoveredIndex,
  setHoveredIndex,
  handleWheelClick,
  wheelColors,
  center,
  centerRadius,
  buttonRadius,
  labelRadius,
  polarToCartesian,
  getSliceLift,
  centerLines,
  animationKey
}) => {
  const outerWheelRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!outerWheelRef.current) return;

    outerWheelRef.current.getAnimations().forEach((animation) => animation.cancel());

    outerWheelRef.current.style.transform = 'rotate(0deg)';

    const animation = outerWheelRef.current.animate(
      [
        { transform: 'rotate(-140deg)' },
        { transform: 'rotate(12deg)' },
        { transform: 'rotate(0deg)' }
      ],
      {
        duration: 3200,
        easing: 'cubic-bezier(0.22, 0.9, 0.2, 1)',
        fill: 'forwards'
      }
    );

    return () => {
      animation.cancel();
    };
  }, [animationKey]);

  return (
    <div className="flex justify-center items-center py-10">
      <svg width="400" height="400" viewBox="0 0 400 400">
        <defs>
          {wheelColors.map((color, i) => (
            <radialGradient key={i} id={`grad-${i}`} cx="50%" cy="30%" r="80%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="25%" stopColor={color} />
              <stop offset="65%" stopColor={color} />
              <stop offset="100%" stopColor="#00000066" />
            </radialGradient>
          ))}
        </defs>

        <g
          ref={outerWheelRef}
          style={{
            transformOrigin: `${center}px ${center}px`
          }}
        >
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

            const translateX = hoveredIndex === i ? lift.dx : 0;
            const translateY = hoveredIndex === i ? lift.dy : 0;

            return (
              <g
                key={i}
                onClick={() => handleWheelClick(item)}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                transform={`translate(${translateX}, ${translateY})`}
                style={{
                  cursor: item.comingSoon ? 'default' : 'pointer',
                  transition: 'transform 0.22s ease, filter 0.22s ease'
                }}
              >
                <path
                  d={path}
                  fill={`url(#grad-${i})`}
                  stroke="none"
                  style={{
                    filter:
                      hoveredIndex === i
                        ? 'drop-shadow(0 14px 22px rgba(0,0,0,0.95))'
                        : 'drop-shadow(0 7px 12px rgba(0,0,0,0.78))'
                  }}
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
          stroke="none"
        />

        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#000"
          fontWeight="900"
          fontSize="14"
          style={{ pointerEvents: 'none' }}
        >
          {centerLines.map((line, idx) => (
            <tspan
              key={idx}
              x={center}
              dy={
                idx === 0
                  ? centerLines.length > 1
                    ? -((centerLines.length - 1) * 7)
                    : 0
                  : 14
              }
            >
              {line}
            </tspan>
          ))}
        </text>
      </svg>
    </div>
  );
};

export default ProjectsWheelMenu;

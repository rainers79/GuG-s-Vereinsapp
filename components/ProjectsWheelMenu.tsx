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

let lastPlayedAnimationKey = -1;

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
  const rotatingRingRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!rotatingRingRef.current) return;
    if (animationKey <= 0) return;
    if (animationKey === lastPlayedAnimationKey) return;

    lastPlayedAnimationKey = animationKey;

    rotatingRingRef.current.getAnimations().forEach((animation) => animation.cancel());
    rotatingRingRef.current.style.transform = 'rotate(0deg)';

    const animation = rotatingRingRef.current.animate(
      [
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(360deg)' }
      ],
      {
        duration: 2800,
        easing: 'ease-in-out',
        fill: 'forwards'
      }
    );

    return () => {
      animation.cancel();
    };
  }, [animationKey]);

  const segmentGapAngle = 9;
  const innerGapRadius = 20;
  const cornerRoundStroke = 20;

  return (
    <div className="flex justify-center items-center py-10">
      <svg width="400" height="400" viewBox="0 0 400 400">
        <defs>
          {wheelColors.map((color, i) => (
            <React.Fragment key={i}>
              <linearGradient id={`seg-fill-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.14" />
                <stop offset="8%" stopColor={color} stopOpacity="1" />
                <stop offset="58%" stopColor={color} stopOpacity="1" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.14" />
              </linearGradient>

              <linearGradient id={`seg-rim-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.34" />
                <stop offset="14%" stopColor="#ffffff" stopOpacity="0.1" />
                <stop offset="40%" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>

              <radialGradient id={`seg-gloss-${i}`} cx="35%" cy="18%" r="95%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.20" />
                <stop offset="22%" stopColor="#ffffff" stopOpacity="0.10" />
                <stop offset="52%" stopColor="#ffffff" stopOpacity="0.03" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </radialGradient>

              <linearGradient id={`seg-bottom-shade-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#000000" stopOpacity="0" />
                <stop offset="70%" stopColor="#000000" stopOpacity="0.02" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.10" />
              </linearGradient>
            </React.Fragment>
          ))}

          <radialGradient id="center-fill" cx="50%" cy="35%" r="75%">
            <stop offset="0%" stopColor="#ded2b0" />
            <stop offset="100%" stopColor="#cdbd96" />
          </radialGradient>
        </defs>

        <g
          ref={rotatingRingRef}
          style={{
            transformOrigin: `${center}px ${center}px`,
            transformBox: 'view-box'
          }}
        >
          {wheelItems.map((item, i) => {
            const sliceAngle = 360 / wheelItems.length;
            const rawStartAngle = i * sliceAngle;
            const rawEndAngle = (i + 1) * sliceAngle;

            const startAngle = rawStartAngle + segmentGapAngle / 2;
            const endAngle = rawEndAngle - segmentGapAngle / 2;

            const outerStart = polarToCartesian(center, center, buttonRadius, startAngle);
            const outerEnd = polarToCartesian(center, center, buttonRadius, endAngle);

            const innerRadiusWithGap = centerRadius + innerGapRadius;
            const innerStart = polarToCartesian(center, center, innerRadiusWithGap, startAngle);
            const innerEnd = polarToCartesian(center, center, innerRadiusWithGap, endAngle);

            const largeArc = endAngle - startAngle <= 180 ? 0 : 1;

            const path = `
M ${outerStart.x} ${outerStart.y}
A ${buttonRadius} ${buttonRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}
L ${innerEnd.x} ${innerEnd.y}
A ${innerRadiusWithGap} ${innerRadiusWithGap} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}
Z
`;

            const mid = (startAngle + endAngle) / 2;
            const label = polarToCartesian(center, center, labelRadius + 4, mid);
            const lift = getSliceLift(i, wheelItems.length);

            const translateX = hoveredIndex === i ? lift.dx * 2 : lift.dx;
            const translateY = hoveredIndex === i ? lift.dy * 2 : lift.dy;
            const segmentColor = wheelColors[i] || '#cccccc';

            return (
              <g
                key={i}
                onClick={() => handleWheelClick(item)}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                transform={`translate(${translateX}, ${translateY})`}
                style={{
                  cursor: item.comingSoon ? 'default' : 'pointer',
                  transition: 'transform 0.28s ease'
                }}
              >
                <path
                  d={path}
                  fill={`url(#seg-fill-${i})`}
                  stroke={segmentColor}
                  strokeWidth={cornerRoundStroke}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />

                <path
                  d={path}
                  fill={`url(#seg-rim-${i})`}
                  stroke="none"
                />

                <path
                  d={path}
                  fill={`url(#seg-gloss-${i})`}
                  stroke="none"
                />

                <path
                  d={path}
                  fill={`url(#seg-bottom-shade-${i})`}
                  stroke="none"
                />

                <text
                  x={label.x}
                  y={label.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#111111"
                  fontWeight="900"
                  fontSize="13"
                >
                  {item.label}
                </text>
              </g>
            );
          })}
        </g>

        <g>
          <circle
            cx={center}
            cy={center}
            r={centerRadius}
            fill="url(#center-fill)"
            stroke="none"
          />

          <text
            x={center}
            y={center}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#111111"
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
        </g>
      </svg>
    </div>
  );
};

export default ProjectsWheelMenu;

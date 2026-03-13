import React, { useEffect, useMemo, useRef } from 'react';
import { ViewType } from '../types';
import {
  CalendarDays,
  CheckSquare,
  BarChart3,
  Receipt,
  ShoppingCart,
  Users,
  MessageCircle,
  Wallet,
  ChevronRight,
  ChevronLeft,
  Lock,
  FolderKanban
} from 'lucide-react';

export type ProjectsWheelDisplayItem = {
  label: string;
  actionKey: string;
  view?: ViewType;
  comingSoon?: boolean;
  projectId?: number;
  slotType: 'project' | 'action' | 'next' | 'prev' | 'empty' | 'locked';
};

interface Point {
  x: number;
  y: number;
}

interface Props {
  wheelItems: ProjectsWheelDisplayItem[];
  hoveredIndex: number | null;
  setHoveredIndex: (i: number | null) => void;
  handleWheelClick: (item: ProjectsWheelDisplayItem) => void;
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
  centerSubLabel?: string;
  onCenterClick?: () => void;
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
  centerSubLabel,
  onCenterClick,
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

  const segmentGapAngle = 6;
  const innerGapRadius = 18;
  const outerRingShadowRadius = buttonRadius + 12;
  const innerRadiusWithGap = centerRadius + innerGapRadius;

  const interactiveSlots = useMemo(
    () => new Set<ProjectsWheelDisplayItem['slotType']>(['project', 'action', 'next', 'prev']),
    []
  );

  const getSegmentPalette = (item: ProjectsWheelDisplayItem, index: number) => {
    const isHovered = hoveredIndex === index;
    const isInteractive = interactiveSlots.has(item.slotType);

    if (item.slotType === 'empty') {
      return {
        fill: 'url(#segmentEmptyGradient)',
        stroke: 'rgba(255,255,255,0.06)',
        text: '#6B7280',
        icon: '#7C8595',
        opacity: 0.62,
        filter: 'url(#segmentShadowSoft)',
        innerStroke: 'rgba(255,255,255,0.04)'
      };
    }

    if (item.slotType === 'locked') {
      return {
        fill: 'url(#segmentLockedGradient)',
        stroke: 'rgba(255,255,255,0.08)',
        text: '#9CA3AF',
        icon: '#A1A8B5',
        opacity: 0.9,
        filter: 'url(#segmentShadowSoft)',
        innerStroke: 'rgba(255,255,255,0.05)'
      };
    }

    if (item.slotType === 'next' || item.slotType === 'prev') {
      return {
        fill: isHovered ? 'url(#segmentHighlightGradientStrong)' : 'url(#segmentHighlightGradient)',
        stroke: isHovered ? 'rgba(245, 166, 35, 0.58)' : 'rgba(245, 166, 35, 0.34)',
        text: '#F5E6BF',
        icon: '#F5C86B',
        opacity: 1,
        filter: isHovered ? 'url(#segmentGlowStrong)' : 'url(#segmentGlowSoft)',
        innerStroke: 'rgba(255,255,255,0.10)'
      };
    }

    if (item.slotType === 'action') {
      const highlightKeys = new Set(['calendar', 'tasks', 'polls', 'invoices', 'shopping', 'coreteam', 'chatlog', 'pos']);
      const isHighlight = highlightKeys.has(item.actionKey);

      if (isHighlight) {
        return {
          fill: isHovered ? 'url(#segmentHighlightGradientStrong)' : 'url(#segmentHighlightGradient)',
          stroke: isHovered ? 'rgba(245, 166, 35, 0.55)' : 'rgba(245, 166, 35, 0.28)',
          text: '#FFF7E7',
          icon: '#FFD27A',
          opacity: 1,
          filter: isHovered ? 'url(#segmentGlowStrong)' : 'url(#segmentGlowSoft)',
          innerStroke: 'rgba(255,255,255,0.12)'
        };
      }
    }

    if (item.slotType === 'project') {
      return {
        fill: isHovered ? 'url(#segmentProjectGradientHover)' : 'url(#segmentProjectGradient)',
        stroke: isHovered ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.08)',
        text: '#F3F4F6',
        icon: '#D1D5DB',
        opacity: 1,
        filter: isHovered ? 'url(#segmentShadowLifted)' : 'url(#segmentShadowSoft)',
        innerStroke: 'rgba(255,255,255,0.09)'
      };
    }

    return {
      fill: isHovered ? 'url(#segmentProjectGradientHover)' : 'url(#segmentProjectGradient)',
      stroke: 'rgba(255,255,255,0.08)',
      text: '#F3F4F6',
      icon: '#D1D5DB',
      opacity: isInteractive ? 1 : 0.9,
      filter: 'url(#segmentShadowSoft)',
      innerStroke: 'rgba(255,255,255,0.08)'
    };
  };

  const renderIcon = (
    item: ProjectsWheelDisplayItem,
    x: number,
    y: number,
    color: string
  ) => {
    const common = {
      size: 20,
      strokeWidth: 2.1,
      color
    };

    switch (item.actionKey) {
      case 'calendar':
        return <CalendarDays {...common} x={x - 10} y={y - 10} />;
      case 'tasks':
        return <CheckSquare {...common} x={x - 10} y={y - 10} />;
      case 'polls':
        return <BarChart3 {...common} x={x - 10} y={y - 10} />;
      case 'invoices':
        return <Receipt {...common} x={x - 10} y={y - 10} />;
      case 'shopping':
        return <ShoppingCart {...common} x={x - 10} y={y - 10} />;
      case 'coreteam':
        return <Users {...common} x={x - 10} y={y - 10} />;
      case 'chatlog':
      case 'chat-group':
        return <MessageCircle {...common} x={x - 10} y={y - 10} />;
      case 'pos':
        return <Wallet {...common} x={x - 10} y={y - 10} />;
      case 'next':
      case 'chat-next':
        return <ChevronRight {...common} x={x - 10} y={y - 10} />;
      case 'prev':
      case 'chat-prev':
        return <ChevronLeft {...common} x={x - 10} y={y - 10} />;
      case 'empty':
        return <FolderKanban {...common} x={x - 10} y={y - 10} />;
      default:
        if (item.slotType === 'locked') {
          return <Lock {...common} x={x - 10} y={y - 10} />;
        }
        return <FolderKanban {...common} x={x - 10} y={y - 10} />;
    }
  };

  return (
    <div className="flex justify-center items-center py-10">
      <svg width="400" height="400" viewBox="0 0 400 400" role="img" aria-label="Projekt Radmenü">
        <defs>
          <radialGradient id="bgGlow" cx="38%" cy="34%" r="78%">
            <stop offset="0%" stopColor="rgba(245,166,35,0.18)" />
            <stop offset="40%" stopColor="rgba(245,166,35,0.08)" />
            <stop offset="100%" stopColor="rgba(10,14,22,0)" />
          </radialGradient>

          <linearGradient id="segmentProjectGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#394150" />
            <stop offset="48%" stopColor="#1F2733" />
            <stop offset="100%" stopColor="#161C26" />
          </linearGradient>

          <linearGradient id="segmentProjectGradientHover" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4A5568" />
            <stop offset="48%" stopColor="#263140" />
            <stop offset="100%" stopColor="#1A2230" />
          </linearGradient>

          <linearGradient id="segmentHighlightGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F8C86B" />
            <stop offset="48%" stopColor="#F5A623" />
            <stop offset="100%" stopColor="#C97C11" />
          </linearGradient>

          <linearGradient id="segmentHighlightGradientStrong" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD78F" />
            <stop offset="45%" stopColor="#F7B645" />
            <stop offset="100%" stopColor="#D78613" />
          </linearGradient>

          <linearGradient id="segmentEmptyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#232B36" />
            <stop offset="100%" stopColor="#151B24" />
          </linearGradient>

          <linearGradient id="segmentLockedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2F3743" />
            <stop offset="100%" stopColor="#1A202B" />
          </linearGradient>

          <linearGradient id="centerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3A3326" />
            <stop offset="45%" stopColor="#25211B" />
            <stop offset="100%" stopColor="#151515" />
          </linearGradient>

          <filter id="wheelShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="18" stdDeviation="22" floodColor="#000000" floodOpacity="0.34" />
          </filter>

          <filter id="segmentShadowSoft" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="6" stdDeviation="9" floodColor="#000000" floodOpacity="0.30" />
          </filter>

          <filter id="segmentShadowLifted" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#000000" floodOpacity="0.34" />
          </filter>

          <filter id="segmentGlowSoft" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#F5A623" floodOpacity="0.22" />
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000000" floodOpacity="0.20" />
          </filter>

          <filter id="segmentGlowStrong" x="-60%" y="-60%" width="220%" height="220%">
            <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#F5A623" floodOpacity="0.34" />
            <feDropShadow dx="0" dy="8" stdDeviation="11" floodColor="#000000" floodOpacity="0.22" />
          </filter>

          <filter id="centerShadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="10" stdDeviation="16" floodColor="#000000" floodOpacity="0.38" />
          </filter>
        </defs>

        <rect x="0" y="0" width="400" height="400" rx="36" fill="transparent" />
        <circle cx={center} cy={center} r={outerRingShadowRadius} fill="url(#bgGlow)" />

        <circle
          cx={center}
          cy={center}
          r={buttonRadius + 10}
          fill="rgba(13,17,23,0.72)"
          filter="url(#wheelShadow)"
        />

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
            const iconPoint = polarToCartesian(center, center, labelRadius - 10, mid);
            const textPoint = polarToCartesian(center, center, labelRadius + 15, mid);
            const lift = getSliceLift(i, wheelItems.length);

            const isHovered = hoveredIndex === i;
            const translateX = isHovered ? lift.dx * 1.35 : lift.dx * 0.68;
            const translateY = isHovered ? lift.dy * 1.35 : lift.dy * 0.68;

            const palette = getSegmentPalette(item, i);
            const isClickable = interactiveSlots.has(item.slotType);

            const lines = (() => {
              const source = item.label?.trim() || '';
              if (!source) return [''];
              const words = source.split(/\s+/);
              const result: string[] = [];
              let current = '';

              for (const word of words) {
                const next = current ? `${current} ${word}` : word;
                if (next.length <= 12) {
                  current = next;
                } else {
                  if (current) result.push(current);
                  current = word;
                }
              }

              if (current) result.push(current);
              return result.slice(0, 2);
            })();

            return (
              <g
                key={`${item.actionKey}-${item.projectId ?? i}`}
                onClick={() => isClickable && handleWheelClick(item)}
                onMouseEnter={() => isClickable && setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                transform={`translate(${translateX}, ${translateY})`}
                style={{
                  cursor: isClickable ? 'pointer' : 'default',
                  transition: 'transform 200ms ease-out'
                }}
              >
                <path
                  d={path}
                  fill={palette.fill}
                  stroke={palette.stroke}
                  strokeWidth={1.2}
                  opacity={palette.opacity}
                  filter={palette.filter}
                />

                <path
                  d={path}
                  fill="none"
                  stroke={palette.innerStroke}
                  strokeWidth={0.9}
                  opacity={0.9}
                />

                <path
                  d={path}
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth={0.55}
                  opacity={0.75}
                />

                {renderIcon(item, iconPoint.x, iconPoint.y, palette.icon)}

                <text
                  x={textPoint.x}
                  y={textPoint.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={palette.text}
                  fontWeight="700"
                  fontSize="12.5"
                  letterSpacing="0.2"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {lines.map((line, idx) => (
                    <tspan
                      key={idx}
                      x={textPoint.x}
                      dy={idx === 0 ? 0 : 13}
                    >
                      {line}
                    </tspan>
                  ))}
                </text>
              </g>
            );
          })}
        </g>

        <g
          onClick={onCenterClick}
          style={{ cursor: onCenterClick ? 'pointer' : 'default' }}
        >
          <circle
            cx={center}
            cy={center}
            r={centerRadius + 8}
            fill="rgba(255,255,255,0.03)"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
            filter="url(#centerShadow)"
          />

          <circle
            cx={center}
            cy={center}
            r={centerRadius}
            fill="url(#centerGradient)"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1.2"
          />

          <circle
            cx={center - 16}
            cy={center - 18}
            r={centerRadius * 0.62}
            fill="rgba(255,255,255,0.045)"
          />

          <text
            x={center}
            y={center - (centerSubLabel ? 10 : 0)}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#F9FAFB"
            fontWeight="800"
            fontSize="14"
            letterSpacing="0.2"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {centerLines.map((line, idx) => (
              <tspan
                key={idx}
                x={center}
                dy={
                  idx === 0
                    ? centerLines.length > 1
                      ? -((centerLines.length - 1) * 8)
                      : 0
                    : 16
                }
              >
                {line}
              </tspan>
            ))}
          </text>

          {centerSubLabel && (
            <text
              x={center}
              y={center + 30}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#C7CDD8"
              fontWeight="600"
              fontSize="11"
              letterSpacing="0.5"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {centerSubLabel}
            </text>
          )}
        </g>
      </svg>
    </div>
  );
};

export default ProjectsWheelMenu;

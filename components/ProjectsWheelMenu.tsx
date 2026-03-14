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

const arcPath = (
  polarToCartesianFn: (cx: number, cy: number, radius: number, angleDeg: number) => Point,
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
) => {
  const start = polarToCartesianFn(cx, cy, radius, startAngle);
  const end = polarToCartesianFn(cx, cy, radius, endAngle);
  const largeArc = Math.abs(endAngle - startAngle) <= 180 ? 0 : 1;

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
};

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

  void wheelColors;

  const wheelCx = center;
  const wheelCy = center - 18;

  const outerRadius = Math.max(132, buttonRadius - 28);
  const innerRadiusWithGap = Math.max(centerRadius + 28, 100);
  const visualCenterRadius = Math.max(centerRadius - 6, 64);
  const outerRingShadowRadius = outerRadius + 16;
  const contentRadius = Math.max(
    innerRadiusWithGap + 18,
    Math.min(labelRadius - 6, (outerRadius + innerRadiusWithGap) / 2)
  );

  const segmentGapAngle = 9.5;

  const actionCount = useMemo(
    () => wheelItems.filter((item) => item.slotType === 'action').length,
    [wheelItems]
  );

  const interactiveSlots = useMemo(
    () => new Set<ProjectsWheelDisplayItem['slotType']>(['project', 'action', 'next', 'prev']),
    []
  );

  const firstActionIndex = useMemo(
    () => wheelItems.findIndex((item) => item.slotType === 'action'),
    [wheelItems]
  );

  const topLabel = useMemo(() => {
    const first = centerLines[0]?.trim();
    if (!first) return 'Projekt';
    if (first.length <= 18) return first;
    return `${first.slice(0, 18)}…`;
  }, [centerLines]);

  const centerMetaTop = useMemo(() => {
    if (actionCount > 0) return `${actionCount} Module aktiv`;
    return '';
  }, [actionCount]);

  const progressValue = useMemo(() => {
    if (actionCount > 0) return 75;
    return null;
  }, [actionCount]);

  const getSegmentPalette = (item: ProjectsWheelDisplayItem, index: number) => {
    const isHovered = hoveredIndex === index;
    const isDefaultActive =
      hoveredIndex === null &&
      item.slotType === 'action' &&
      index === firstActionIndex;

    const isHighlighted = isHovered || isDefaultActive;

    if (item.slotType === 'empty') {
      return {
        baseFill: 'url(#segmentEmptyGradient)',
        topFill: 'url(#segmentTopLightDark)',
        stroke: 'rgba(255,255,255,0.035)',
        text: '#788292',
        icon: '#8791A1',
        opacity: 0.54,
        filter: 'url(#segmentShadowSoft)',
        innerStroke: 'rgba(255,255,255,0.03)',
        glow: false,
        fontWeight: 600 as const
      };
    }

    if (item.slotType === 'locked') {
      return {
        baseFill: 'url(#segmentLockedGradient)',
        topFill: 'url(#segmentTopLightDark)',
        stroke: 'rgba(255,255,255,0.045)',
        text: '#94A0B0',
        icon: '#A3AFBE',
        opacity: 0.82,
        filter: 'url(#segmentShadowSoft)',
        innerStroke: 'rgba(255,255,255,0.04)',
        glow: false,
        fontWeight: 600 as const
      };
    }

    if (item.slotType === 'next' || item.slotType === 'prev') {
      return {
        baseFill: isHighlighted ? 'url(#segmentHighlightGradient)' : 'url(#segmentProjectGradient)',
        topFill: isHighlighted ? 'url(#segmentTopLightHighlight)' : 'url(#segmentTopLightDark)',
        stroke: isHighlighted ? 'rgba(255,218,146,0.72)' : 'rgba(255,255,255,0.055)',
        text: isHighlighted ? '#FFF8EC' : '#E2E8F0',
        icon: isHighlighted ? '#FFE1A6' : '#CBD5E1',
        opacity: 1,
        filter: isHighlighted ? 'url(#segmentGlowStrong)' : 'url(#segmentShadowSoft)',
        innerStroke: isHighlighted ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.06)',
        glow: isHighlighted,
        fontWeight: isHighlighted ? (700 as const) : (600 as const)
      };
    }

    if (item.slotType === 'action') {
      return {
        baseFill: isHighlighted ? 'url(#segmentHighlightGradient)' : 'url(#segmentProjectGradient)',
        topFill: isHighlighted ? 'url(#segmentTopLightHighlight)' : 'url(#segmentTopLightDark)',
        stroke: isHighlighted ? 'rgba(255,220,156,0.78)' : 'rgba(255,255,255,0.06)',
        text: isHighlighted ? '#FFF9EE' : '#EEF2F7',
        icon: isHighlighted ? '#FFE5B2' : '#D6DEE8',
        opacity: 1,
        filter: isHighlighted ? 'url(#segmentGlowStrong)' : 'url(#segmentShadowSoft)',
        innerStroke: isHighlighted ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.065)',
        glow: isHighlighted,
        fontWeight: isHighlighted ? (700 as const) : (600 as const)
      };
    }

    if (item.slotType === 'project') {
      return {
        baseFill: isHighlighted ? 'url(#segmentProjectGradientHover)' : 'url(#segmentProjectGradient)',
        topFill: 'url(#segmentTopLightDark)',
        stroke: isHighlighted ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
        text: '#EFF4FA',
        icon: '#D9E0EA',
        opacity: 1,
        filter: isHighlighted ? 'url(#segmentShadowLifted)' : 'url(#segmentShadowSoft)',
        innerStroke: isHighlighted ? 'rgba(255,255,255,0.11)' : 'rgba(255,255,255,0.06)',
        glow: false,
        fontWeight: 650 as const
      };
    }

    return {
      baseFill: 'url(#segmentProjectGradient)',
      topFill: 'url(#segmentTopLightDark)',
      stroke: 'rgba(255,255,255,0.06)',
      text: '#EFF4FA',
      icon: '#D9E0EA',
      opacity: 1,
      filter: 'url(#segmentShadowSoft)',
      innerStroke: 'rgba(255,255,255,0.06)',
      glow: false,
      fontWeight: 600 as const
    };
  };

  const renderIcon = (
    item: ProjectsWheelDisplayItem,
    x: number,
    y: number,
    color: string
  ) => {
    const common = {
      size: 17,
      strokeWidth: 2,
      color
    };

    switch (item.actionKey) {
      case 'calendar':
        return <CalendarDays {...common} x={x - 8.5} y={y - 8.5} />;
      case 'tasks':
        return <CheckSquare {...common} x={x - 8.5} y={y - 8.5} />;
      case 'polls':
        return <BarChart3 {...common} x={x - 8.5} y={y - 8.5} />;
      case 'invoices':
        return <Receipt {...common} x={x - 8.5} y={y - 8.5} />;
      case 'shopping':
        return <ShoppingCart {...common} x={x - 8.5} y={y - 8.5} />;
      case 'coreteam':
        return <Users {...common} x={x - 8.5} y={y - 8.5} />;
      case 'chatlog':
      case 'chat-group':
        return <MessageCircle {...common} x={x - 8.5} y={y - 8.5} />;
      case 'pos':
        return <Wallet {...common} x={x - 8.5} y={y - 8.5} />;
      case 'next':
      case 'chat-next':
        return <ChevronRight {...common} x={x - 8.5} y={y - 8.5} />;
      case 'prev':
      case 'chat-prev':
        return <ChevronLeft {...common} x={x - 8.5} y={y - 8.5} />;
      case 'empty':
        return <FolderKanban {...common} x={x - 8.5} y={y - 8.5} />;
      default:
        if (item.slotType === 'locked') {
          return <Lock {...common} x={x - 8.5} y={y - 8.5} />;
        }
        return <FolderKanban {...common} x={x - 8.5} y={y - 8.5} />;
    }
  };

  const progressCircumference = 2 * Math.PI * 18.5;
  const progressOffset =
    progressValue === null
      ? progressCircumference
      : progressCircumference * (1 - progressValue / 100);

  return (
    <div className="flex justify-center items-center py-4">
      <svg
        width="400"
        height="420"
        viewBox="0 0 400 420"
        role="img"
        aria-label="Projekt Radmenü"
      >
        <defs>
          <radialGradient id="screenBg" cx="50%" cy="32%" r="86%">
            <stop offset="0%" stopColor="#282C34" />
            <stop offset="42%" stopColor="#151A22" />
            <stop offset="100%" stopColor="#0A0E14" />
          </radialGradient>

          <radialGradient id="screenGlowTop" cx="50%" cy="28%" r="52%">
            <stop offset="0%" stopColor="rgba(247,184,76,0.10)" />
            <stop offset="45%" stopColor="rgba(247,184,76,0.03)" />
            <stop offset="100%" stopColor="rgba(247,184,76,0)" />
          </radialGradient>

          <radialGradient id="screenGlowBottom" cx="52%" cy="78%" r="42%">
            <stop offset="0%" stopColor="rgba(247,184,76,0.06)" />
            <stop offset="55%" stopColor="rgba(247,184,76,0.015)" />
            <stop offset="100%" stopColor="rgba(247,184,76,0)" />
          </radialGradient>

          <linearGradient id="segmentProjectGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#243245" />
            <stop offset="42%" stopColor="#101722" />
            <stop offset="100%" stopColor="#0A1018" />
          </linearGradient>

          <linearGradient id="segmentProjectGradientHover" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#36485F" />
            <stop offset="40%" stopColor="#17212F" />
            <stop offset="100%" stopColor="#0F151E" />
          </linearGradient>

          <linearGradient id="segmentHighlightGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE4B0" />
            <stop offset="32%" stopColor="#FFD48B" />
            <stop offset="68%" stopColor="#F0B347" />
            <stop offset="100%" stopColor="#C47B18" />
          </linearGradient>

          <linearGradient id="segmentTopLightDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.13)" />
            <stop offset="22%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          <linearGradient id="segmentTopLightHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.26)" />
            <stop offset="24%" stopColor="rgba(255,245,225,0.10)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          <linearGradient id="segmentEmptyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1A222D" />
            <stop offset="100%" stopColor="#0C1118" />
          </linearGradient>

          <linearGradient id="segmentLockedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#252D38" />
            <stop offset="100%" stopColor="#10161F" />
          </linearGradient>

          <radialGradient id="centerGradient" cx="34%" cy="26%" r="82%">
            <stop offset="0%" stopColor="#58461F" />
            <stop offset="36%" stopColor="#2E281E" />
            <stop offset="72%" stopColor="#14171D" />
            <stop offset="100%" stopColor="#0C1016" />
          </radialGradient>

          <radialGradient id="centerLight" cx="34%" cy="30%" r="60%">
            <stop offset="0%" stopColor="rgba(255,224,154,0.16)" />
            <stop offset="58%" stopColor="rgba(255,224,154,0.04)" />
            <stop offset="100%" stopColor="rgba(255,224,154,0)" />
          </radialGradient>

          <filter id="cardShadow" x="-30%" y="-30%" width="160%" height="180%">
            <feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#000000" floodOpacity="0.34" />
          </filter>

          <filter id="wheelShadow" x="-45%" y="-45%" width="190%" height="190%">
            <feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#000000" floodOpacity="0.42" />
          </filter>

          <filter id="segmentShadowSoft" x="-45%" y="-45%" width="190%" height="190%">
            <feDropShadow dx="0" dy="7" stdDeviation="8" floodColor="#000000" floodOpacity="0.34" />
          </filter>

          <filter id="segmentShadowLifted" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#000000" floodOpacity="0.38" />
          </filter>

          <filter id="segmentGlowStrong" x="-70%" y="-70%" width="240%" height="240%">
            <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#F5B34A" floodOpacity="0.34" />
            <feDropShadow dx="0" dy="0" stdDeviation="16" floodColor="#F5B34A" floodOpacity="0.10" />
            <feDropShadow dx="0" dy="9" stdDeviation="11" floodColor="#000000" floodOpacity="0.22" />
          </filter>

          <filter id="ringGlow" x="-70%" y="-70%" width="240%" height="240%">
            <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#F5B34A" floodOpacity="0.10" />
            <feDropShadow dx="0" dy="0" stdDeviation="22" floodColor="#F5B34A" floodOpacity="0.05" />
          </filter>

          <filter id="centerShadow" x="-60%" y="-60%" width="220%" height="220%">
            <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#000000" floodOpacity="0.42" />
          </filter>
        </defs>

        <rect
          x="34"
          y="14"
          width="332"
          height="364"
          rx="24"
          fill="url(#screenBg)"
          filter="url(#cardShadow)"
        />

        <rect x="34" y="14" width="332" height="364" rx="24" fill="url(#screenGlowTop)" />
        <rect x="34" y="14" width="332" height="364" rx="24" fill="url(#screenGlowBottom)" />
        <rect
          x="34"
          y="14"
          width="332"
          height="364"
          rx="24"
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth="1"
        />

        <text
          x="66"
          y="45"
          fill="#F4F6FA"
          fontSize="8.8"
          fontWeight="600"
          letterSpacing="0.15"
          opacity="0.95"
        >
          {topLabel}
        </text>

        <path
          d={arcPath(polarToCartesian, wheelCx, wheelCy, outerRadius + 7, -20, 34)}
          fill="none"
          stroke="rgba(245,179,74,0.15)"
          strokeWidth="2.6"
          strokeLinecap="round"
          filter="url(#ringGlow)"
        />

        <path
          d={arcPath(polarToCartesian, wheelCx, wheelCy, outerRadius + 7, 148, 220)}
          fill="none"
          stroke="rgba(245,179,74,0.09)"
          strokeWidth="2.1"
          strokeLinecap="round"
          filter="url(#ringGlow)"
        />

        <circle
          cx={wheelCx}
          cy={wheelCy}
          r={outerRingShadowRadius}
          fill="rgba(0,0,0,0.14)"
          filter="url(#wheelShadow)"
        />

        <circle
          cx={wheelCx}
          cy={wheelCy}
          r={outerRadius + 7}
          fill="none"
          stroke="rgba(255,255,255,0.03)"
          strokeWidth="1"
        />

        <g
          ref={rotatingRingRef}
          style={{
            transformOrigin: `${wheelCx}px ${wheelCy}px`,
            transformBox: 'view-box'
          }}
        >
          {wheelItems.map((item, i) => {
            const sliceAngle = 360 / wheelItems.length;
            const rawStartAngle = i * sliceAngle;
            const rawEndAngle = (i + 1) * sliceAngle;

            const startAngle = rawStartAngle + segmentGapAngle / 2;
            const endAngle = rawEndAngle - segmentGapAngle / 2;

            const outerStart = polarToCartesian(wheelCx, wheelCy, outerRadius, startAngle);
            const outerEnd = polarToCartesian(wheelCx, wheelCy, outerRadius, endAngle);
            const innerStart = polarToCartesian(
              wheelCx,
              wheelCy,
              innerRadiusWithGap,
              startAngle
            );
            const innerEnd = polarToCartesian(
              wheelCx,
              wheelCy,
              innerRadiusWithGap,
              endAngle
            );

            const largeArc = endAngle - startAngle <= 180 ? 0 : 1;

            const path = `
M ${outerStart.x} ${outerStart.y}
A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}
L ${innerEnd.x} ${innerEnd.y}
A ${innerRadiusWithGap} ${innerRadiusWithGap} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}
Z
`;

            const mid = (startAngle + endAngle) / 2;
            const iconPoint = polarToCartesian(
              wheelCx,
              wheelCy,
              contentRadius - 10,
              mid
            );
            const textPoint = polarToCartesian(
              wheelCx,
              wheelCy,
              contentRadius + 12,
              mid
            );
            const lift = getSliceLift(i, wheelItems.length);

            const isHovered = hoveredIndex === i;
            const isDefaultActive =
              hoveredIndex === null &&
              item.slotType === 'action' &&
              i === firstActionIndex;
            const isHighlighted = isHovered || isDefaultActive;

            const translateX = isHighlighted ? lift.dx * 0.92 : lift.dx * 0.22;
            const translateY = isHighlighted ? lift.dy * 0.92 : lift.dy * 0.22;

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
                if (next.length <= 11) {
                  current = next;
                } else {
                  if (current) result.push(current);
                  current = word;
                }
              }

              if (current) result.push(current);
              return result.slice(0, 2);
            })();

            const textStartY =
              lines.length > 1
                ? textPoint.y - ((lines.length - 1) * 5.85)
                : textPoint.y;

            return (
              <g
                key={`${item.actionKey}-${item.projectId ?? i}`}
                onClick={() => isClickable && handleWheelClick(item)}
                onMouseEnter={() => isClickable && setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                transform={`translate(${translateX}, ${translateY})`}
                style={{
                  cursor: isClickable ? 'pointer' : 'default',
                  transition: 'transform 180ms ease-out'
                }}
              >
                {palette.glow && (
                  <path
                    d={path}
                    fill="none"
                    stroke="rgba(245,179,74,0.34)"
                    strokeWidth="3.2"
                    opacity="0.78"
                    filter="url(#ringGlow)"
                  />
                )}

                <path
                  d={path}
                  fill={palette.baseFill}
                  stroke={palette.baseFill}
                  strokeWidth={10}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  opacity={palette.opacity}
                  filter={palette.filter}
                />

                <path
                  d={path}
                  fill={palette.topFill}
                  opacity={palette.glow ? 0.95 : 0.82}
                />

                <path
                  d={path}
                  fill="none"
                  stroke={palette.stroke}
                  strokeWidth={1.05}
                  opacity={0.96}
                />

                <path
                  d={path}
                  fill="none"
                  stroke={palette.innerStroke}
                  strokeWidth={0.8}
                  opacity={0.92}
                />

                <path
                  d={path}
                  fill="none"
                  stroke={
                    palette.glow
                      ? 'rgba(255,248,232,0.18)'
                      : 'rgba(255,255,255,0.035)'
                  }
                  strokeWidth={0.5}
                  opacity={0.9}
                />

                {renderIcon(item, iconPoint.x, iconPoint.y, palette.icon)}

                <text
                  x={textPoint.x}
                  y={textStartY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={palette.text}
                  fontWeight={palette.fontWeight}
                  fontSize="10.7"
                  letterSpacing="0.08"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {lines.map((line, idx) => (
                    <tspan
                      key={idx}
                      x={textPoint.x}
                      dy={idx === 0 ? 0 : 11.7}
                    >
                      {line}
                    </tspan>
                  ))}
                </text>
              </g>
            );
          })}
        </g>

        <g onClick={onCenterClick} style={{ cursor: onCenterClick ? 'pointer' : 'default' }}>
          <circle
            cx={wheelCx}
            cy={wheelCy}
            r={visualCenterRadius + 10}
            fill="rgba(255,255,255,0.015)"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
            filter="url(#centerShadow)"
          />

          <circle
            cx={wheelCx}
            cy={wheelCy}
            r={visualCenterRadius + 1.5}
            fill="rgba(0,0,0,0.12)"
          />

          <circle
            cx={wheelCx}
            cy={wheelCy}
            r={visualCenterRadius}
            fill="url(#centerGradient)"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1.1"
          />

          <circle
            cx={wheelCx}
            cy={wheelCy}
            r={visualCenterRadius}
            fill="url(#centerLight)"
          />

          <circle
            cx={wheelCx - 16}
            cy={wheelCy - 16}
            r={visualCenterRadius * 0.54}
            fill="rgba(255,255,255,0.05)"
          />

          <circle
            cx={wheelCx}
            cy={wheelCy}
            r={visualCenterRadius - 20}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="0.8"
          />

          <text
            x={wheelCx}
            y={wheelCy - 4}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#FAFBFD"
            fontWeight="700"
            fontSize="11.4"
            letterSpacing="0.08"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {centerLines.map((line, idx) => (
              <tspan
                key={idx}
                x={wheelCx}
                dy={
                  idx === 0
                    ? centerLines.length > 1
                      ? -((centerLines.length - 1) * 7)
                      : 0
                    : 13
                }
              >
                {line}
              </tspan>
            ))}
          </text>

          {centerMetaTop && (
            <text
              x={wheelCx}
              y={wheelCy + 22}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#C9D1DD"
              fontWeight="500"
              fontSize="7.7"
              letterSpacing="0.12"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {centerMetaTop}
            </text>
          )}

          {centerSubLabel && (
            <text
              x={wheelCx}
              y={wheelCy + 35}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#D7DCE6"
              fontWeight="600"
              fontSize="8.2"
              letterSpacing="0.24"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {centerSubLabel}
            </text>
          )}

          {progressValue !== null && (
            <>
              <circle
                cx={wheelCx}
                cy={wheelCy + 48}
                r="18.5"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="3.2"
              />
              <circle
                cx={wheelCx}
                cy={wheelCy + 48}
                r="18.5"
                fill="none"
                stroke="url(#segmentHighlightGradient)"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeDasharray={progressCircumference}
                strokeDashoffset={progressOffset}
                transform={`rotate(-90 ${wheelCx} ${wheelCy + 48})`}
                filter="url(#ringGlow)"
              />
              <text
                x={wheelCx}
                y={wheelCy + 48}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#F8F0E0"
                fontWeight="700"
                fontSize="7.8"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {progressValue}%
              </text>
            </>
          )}
        </g>
      </svg>
    </div>
  );
};

export default ProjectsWheelMenu;

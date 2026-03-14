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

  const segmentGapAngle = 7;
  const innerGapRadius = 24;
  const outerRingShadowRadius = buttonRadius + 18;
  const innerRadiusWithGap = centerRadius + innerGapRadius;

  const interactiveSlots = useMemo(
    () => new Set<ProjectsWheelDisplayItem['slotType']>(['project', 'action', 'next', 'prev']),
    []
  );

  const firstActionIndex = useMemo(
    () => wheelItems.findIndex((item) => item.slotType === 'action'),
    [wheelItems]
  );

  const getSegmentPalette = (item: ProjectsWheelDisplayItem, index: number) => {
    const isHovered = hoveredIndex === index;
    const isDefaultActive = hoveredIndex === null && item.slotType === 'action' && index === firstActionIndex;
    const isHighlighted = isHovered || isDefaultActive;

    if (item.slotType === 'empty') {
      return {
        fill: 'url(#segmentEmptyGradient)',
        stroke: 'rgba(255,255,255,0.045)',
        text: '#7F8898',
        icon: '#8D97A8',
        opacity: 0.58,
        filter: 'url(#segmentShadowSoft)',
        innerStroke: 'rgba(255,255,255,0.035)',
        glow: false
      };
    }

    if (item.slotType === 'locked') {
      return {
        fill: 'url(#segmentLockedGradient)',
        stroke: 'rgba(255,255,255,0.055)',
        text: '#9AA3B3',
        icon: '#A8B1C0',
        opacity: 0.84,
        filter: 'url(#segmentShadowSoft)',
        innerStroke: 'rgba(255,255,255,0.04)',
        glow: false
      };
    }

    if (item.slotType === 'next' || item.slotType === 'prev') {
      return {
        fill: isHighlighted ? 'url(#segmentHighlightGradientStrong)' : 'url(#segmentProjectGradient)',
        stroke: isHighlighted ? 'rgba(255, 197, 96, 0.62)' : 'rgba(255,255,255,0.06)',
        text: isHighlighted ? '#FFF8EA' : '#E7EBF1',
        icon: isHighlighted ? '#FFD27A' : '#C6CED9',
        opacity: 1,
        filter: isHighlighted ? 'url(#segmentGlowStrong)' : 'url(#segmentShadowSoft)',
        innerStroke: isHighlighted ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.06)',
        glow: isHighlighted
      };
    }

    if (item.slotType === 'action') {
      return {
        fill: isHighlighted ? 'url(#segmentHighlightGradientStrong)' : 'url(#segmentProjectGradient)',
        stroke: isHighlighted ? 'rgba(255, 205, 120, 0.72)' : 'rgba(255,255,255,0.07)',
        text: isHighlighted ? '#FFF8EA' : '#EEF2F7',
        icon: isHighlighted ? '#FFE0A2' : '#D4DBE6',
        opacity: 1,
        filter: isHighlighted ? 'url(#segmentGlowStrong)' : 'url(#segmentShadowSoft)',
        innerStroke: isHighlighted ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.075)',
        glow: isHighlighted
      };
    }

    if (item.slotType === 'project') {
      return {
        fill: isHighlighted ? 'url(#segmentProjectGradientHover)' : 'url(#segmentProjectGradient)',
        stroke: isHighlighted ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.07)',
        text: '#EFF3F8',
        icon: '#D6DCE6',
        opacity: 1,
        filter: isHighlighted ? 'url(#segmentShadowLifted)' : 'url(#segmentShadowSoft)',
        innerStroke: isHighlighted ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)',
        glow: false
      };
    }

    return {
      fill: isHighlighted ? 'url(#segmentProjectGradientHover)' : 'url(#segmentProjectGradient)',
      stroke: 'rgba(255,255,255,0.07)',
      text: '#EFF3F8',
      icon: '#D6DCE6',
      opacity: 1,
      filter: 'url(#segmentShadowSoft)',
      innerStroke: 'rgba(255,255,255,0.07)',
      glow: false
    };
  };

  const renderIcon = (
    item: ProjectsWheelDisplayItem,
    x: number,
    y: number,
    color: string
  ) => {
    const common = {
      size: 18,
      strokeWidth: 2,
      color
    };

    switch (item.actionKey) {
      case 'calendar':
        return <CalendarDays {...common} x={x - 9} y={y - 9} />;
      case 'tasks':
        return <CheckSquare {...common} x={x - 9} y={y - 9} />;
      case 'polls':
        return <BarChart3 {...common} x={x - 9} y={y - 9} />;
      case 'invoices':
        return <Receipt {...common} x={x - 9} y={y - 9} />;
      case 'shopping':
        return <ShoppingCart {...common} x={x - 9} y={y - 9} />;
      case 'coreteam':
        return <Users {...common} x={x - 9} y={y - 9} />;
      case 'chatlog':
      case 'chat-group':
        return <MessageCircle {...common} x={x - 9} y={y - 9} />;
      case 'pos':
        return <Wallet {...common} x={x - 9} y={y - 9} />;
      case 'next':
      case 'chat-next':
        return <ChevronRight {...common} x={x - 9} y={y - 9} />;
      case 'prev':
      case 'chat-prev':
        return <ChevronLeft {...common} x={x - 9} y={y - 9} />;
      case 'empty':
        return <FolderKanban {...common} x={x - 9} y={y - 9} />;
      default:
        if (item.slotType === 'locked') {
          return <Lock {...common} x={x - 9} y={y - 9} />;
        }
        return <FolderKanban {...common} x={x - 9} y={y - 9} />;
    }
  };

  return (
    <div className="flex justify-center items-center py-8">
      <svg width="400" height="430" viewBox="0 0 400 430" role="img" aria-label="Projekt Radmenü">
        <defs>
          <radialGradient id="screenBg" cx="50%" cy="34%" r="88%">
            <stop offset="0%" stopColor="#232833" />
            <stop offset="45%" stopColor="#121720" />
            <stop offset="100%" stopColor="#070B11" />
          </radialGradient>

          <radialGradient id="bgGlowTop" cx="52%" cy="35%" r="55%">
            <stop offset="0%" stopColor="rgba(248,183,69,0.14)" />
            <stop offset="42%" stopColor="rgba(248,183,69,0.06)" />
            <stop offset="100%" stopColor="rgba(248,183,69,0)" />
          </radialGradient>

          <radialGradient id="bgGlowBottom" cx="46%" cy="73%" r="50%">
            <stop offset="0%" stopColor="rgba(248,183,69,0.08)" />
            <stop offset="52%" stopColor="rgba(248,183,69,0.03)" />
            <stop offset="100%" stopColor="rgba(248,183,69,0)" />
          </radialGradient>

          <linearGradient id="segmentProjectGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#283244" />
            <stop offset="38%" stopColor="#131A25" />
            <stop offset="100%" stopColor="#0A0F17" />
          </linearGradient>

          <linearGradient id="segmentProjectGradientHover" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#364156" />
            <stop offset="38%" stopColor="#1C2431" />
            <stop offset="100%" stopColor="#101722" />
          </linearGradient>

          <linearGradient id="segmentHighlightGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD78F" />
            <stop offset="45%" stopColor="#F7B645" />
            <stop offset="100%" stopColor="#C77B15" />
          </linearGradient>

          <linearGradient id="segmentHighlightGradientStrong" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE1A7" />
            <stop offset="34%" stopColor="#FFD079" />
            <stop offset="64%" stopColor="#F2AA2D" />
            <stop offset="100%" stopColor="#B96B10" />
          </linearGradient>

          <linearGradient id="segmentEmptyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1F2631" />
            <stop offset="100%" stopColor="#0D121A" />
          </linearGradient>

          <linearGradient id="segmentLockedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2A313D" />
            <stop offset="100%" stopColor="#121822" />
          </linearGradient>

          <radialGradient id="centerGradient" cx="34%" cy="28%" r="82%">
            <stop offset="0%" stopColor="#4B3E1E" />
            <stop offset="36%" stopColor="#2E271C" />
            <stop offset="72%" stopColor="#171717" />
            <stop offset="100%" stopColor="#0E1014" />
          </radialGradient>

          <radialGradient id="centerLight" cx="32%" cy="28%" r="62%">
            <stop offset="0%" stopColor="rgba(255,220,150,0.16)" />
            <stop offset="60%" stopColor="rgba(255,220,150,0.04)" />
            <stop offset="100%" stopColor="rgba(255,220,150,0)" />
          </radialGradient>

          <filter id="screenShadow" x="-30%" y="-30%" width="160%" height="180%">
            <feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#000000" floodOpacity="0.34" />
          </filter>

          <filter id="wheelShadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="16" stdDeviation="20" floodColor="#000000" floodOpacity="0.40" />
          </filter>

          <filter id="segmentShadowSoft" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="6" stdDeviation="9" floodColor="#000000" floodOpacity="0.34" />
          </filter>

          <filter id="segmentShadowLifted" x="-45%" y="-45%" width="190%" height="190%">
            <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#000000" floodOpacity="0.38" />
          </filter>

          <filter id="segmentGlowSoft" x="-60%" y="-60%" width="220%" height="220%">
            <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#F5A623" floodOpacity="0.20" />
            <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#000000" floodOpacity="0.24" />
          </filter>

          <filter id="segmentGlowStrong" x="-70%" y="-70%" width="240%" height="240%">
            <feDropShadow dx="0" dy="0" stdDeviation="12" floodColor="#F6B13B" floodOpacity="0.34" />
            <feDropShadow dx="0" dy="0" stdDeviation="18" floodColor="#F6B13B" floodOpacity="0.12" />
            <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#000000" floodOpacity="0.26" />
          </filter>

          <filter id="centerShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#000000" floodOpacity="0.42" />
          </filter>

          <filter id="ringAmbientGlow" x="-70%" y="-70%" width="240%" height="240%">
            <feDropShadow dx="0" dy="0" stdDeviation="12" floodColor="#F6B13B" floodOpacity="0.10" />
            <feDropShadow dx="0" dy="0" stdDeviation="22" floodColor="#F6B13B" floodOpacity="0.06" />
          </filter>
        </defs>

        <rect
          x="18"
          y="10"
          width="364"
          height="390"
          rx="22"
          fill="url(#screenBg)"
          filter="url(#screenShadow)"
        />

        <rect
          x="18"
          y="10"
          width="364"
          height="390"
          rx="22"
          fill="url(#bgGlowTop)"
        />

        <rect
          x="18"
          y="10"
          width="364"
          height="390"
          rx="22"
          fill="url(#bgGlowBottom)"
        />

        <circle cx={center} cy={center} r={outerRingShadowRadius + 2} fill="rgba(0,0,0,0.18)" filter="url(#wheelShadow)" />
        <circle cx={center} cy={center} r={outerRingShadowRadius - 8} fill="rgba(255,255,255,0.02)" />
        <circle cx={center} cy={center} r={outerRingShadowRadius - 12} fill="none" stroke="rgba(255,255,255,0.035)" strokeWidth="1" />

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
            const iconPoint = polarToCartesian(center, center, labelRadius - 12, mid);
            const textPoint = polarToCartesian(center, center, labelRadius + 8, mid);
            const lift = getSliceLift(i, wheelItems.length);

            const isHovered = hoveredIndex === i;
            const isDefaultActive = hoveredIndex === null && item.slotType === 'action' && i === firstActionIndex;
            const isHighlighted = isHovered || isDefaultActive;

            const translateX = isHighlighted ? lift.dx * 1.12 : lift.dx * 0.38;
            const translateY = isHighlighted ? lift.dy * 1.12 : lift.dy * 0.38;

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
                {palette.glow && (
                  <path
                    d={path}
                    fill="none"
                    stroke="rgba(246,177,59,0.36)"
                    strokeWidth={3.2}
                    opacity={0.78}
                    filter="url(#ringAmbientGlow)"
                  />
                )}

                <path
                  d={path}
                  fill={palette.fill}
                  stroke={palette.stroke}
                  strokeWidth={1.15}
                  opacity={palette.opacity}
                  filter={palette.filter}
                />

                <path
                  d={path}
                  fill="none"
                  stroke={palette.innerStroke}
                  strokeWidth={0.9}
                  opacity={0.92}
                />

                <path
                  d={path}
                  fill="none"
                  stroke={palette.glow ? 'rgba(255,245,220,0.18)' : 'rgba(255,255,255,0.04)'}
                  strokeWidth={0.55}
                  opacity={0.9}
                />

                {renderIcon(item, iconPoint.x, iconPoint.y, palette.icon)}

                <text
                  x={textPoint.x}
                  y={textPoint.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={palette.text}
                  fontWeight={palette.glow ? '800' : '700'}
                  fontSize="12"
                  letterSpacing="0.15"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {lines.map((line, idx) => (
                    <tspan
                      key={idx}
                      x={textPoint.x}
                      dy={idx === 0 ? 0 : 12.5}
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
            cx={center}
            cy={center}
            r={centerRadius + 12}
            fill="rgba(255,255,255,0.018)"
            stroke="rgba(255,255,255,0.055)"
            strokeWidth="1"
            filter="url(#centerShadow)"
          />

          <circle
            cx={center}
            cy={center}
            r={centerRadius + 2}
            fill="rgba(0,0,0,0.14)"
          />

          <circle
            cx={center}
            cy={center}
            r={centerRadius}
            fill="url(#centerGradient)"
            stroke="rgba(255,255,255,0.09)"
            strokeWidth="1.2"
          />

          <circle
            cx={center}
            cy={center}
            r={centerRadius}
            fill="url(#centerLight)"
          />

          <circle
            cx={center - 18}
            cy={center - 20}
            r={centerRadius * 0.56}
            fill="rgba(255,255,255,0.05)"
          />

          <circle
            cx={center}
            cy={center}
            r={centerRadius - 22}
            fill="none"
            stroke="rgba(255,255,255,0.045)"
            strokeWidth="0.9"
          />

          <text
            x={center}
            y={center - (centerSubLabel ? 12 : 0)}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#FAFBFD"
            fontWeight="800"
            fontSize="14"
            letterSpacing="0.15"
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
                    : 15
                }
              >
                {line}
              </tspan>
            ))}
          </text>

          {centerSubLabel && (
            <text
              x={center}
              y={center + 29}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#D3D9E3"
              fontWeight="600"
              fontSize="11"
              letterSpacing="0.35"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {centerSubLabel}
            </text>
          )}
        </g>

        <g opacity="0.82">
          <text
            x="42"
            y="32"
            fill="#F3F4F6"
            fontSize="8.5"
            fontWeight="600"
            letterSpacing="0.2"
          >
            {centerLines[0] || 'Projekt'}
          </text>
        </g>
      </svg>
    </div>
  );
};

export default ProjectsWheelMenu;

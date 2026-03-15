import React, { useEffect, useMemo, useRef, useState } from 'react';
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

type LabelLayout = {
  lines: string[];
  fontSize: number;
  lineHeight: number;
  fontWeight: number;
  letterSpacing: number;
  textRadiusAdjust: number;
  iconRadiusAdjust: number;
};

let lastPlayedAnimationKey = -1;

const LS_WHEEL_ANIMATION_ENABLED = 'gug_wheel_animation_enabled';

const arcPath = (
  polarToCartesianFn: (cx: number, cy: number, radius: number, angleDeg: number) => Point,
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  sweepFlag = 1
) => {
  const start = polarToCartesianFn(cx, cy, radius, startAngle);
  const end = polarToCartesianFn(cx, cy, radius, endAngle);
  const largeArc = Math.abs(endAngle - startAngle) <= 180 ? 0 : 1;

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} ${sweepFlag} ${end.x} ${end.y}`;
};

const genericWrap = (text: string, maxLen = 10): string[] => {
  const source = (text || '').trim();
  if (!source) return [''];

  const words = source.split(/\s+/);
  const result: string[] = [];
  let current = '';

  const pushBrokenWord = (word: string) => {
    if (word.length <= maxLen) {
      result.push(word);
      return;
    }

    const first = word.slice(0, maxLen);
    const second = word.slice(maxLen, maxLen * 2 - 1);

    result.push(first);
    if (second) result.push(`${second}${word.length > maxLen * 2 - 1 ? '…' : ''}`);
  };

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;

    if (next.length <= maxLen) {
      current = next;
      continue;
    }

    if (current) {
      result.push(current);
      current = '';
    }

    if (word.length > maxLen) {
      pushBrokenWord(word);
    } else {
      current = word;
    }
  }

  if (current) result.push(current);

  return result.slice(0, 2);
};

const getLabelLayout = (item: ProjectsWheelDisplayItem): LabelLayout => {
  switch (item.actionKey) {
    case 'calendar':
      return {
        lines: ['Kalender'],
        fontSize: 9.2,
        lineHeight: 10.8,
        fontWeight: 650,
        letterSpacing: 0.04,
        textRadiusAdjust: 0,
        iconRadiusAdjust: -2
      };

    case 'tasks':
      return {
        lines: ['Aufgaben'],
        fontSize: 9.2,
        lineHeight: 10.8,
        fontWeight: 650,
        letterSpacing: 0.04,
        textRadiusAdjust: 0,
        iconRadiusAdjust: -2
      };

    case 'polls':
      return {
        lines: ['Umfragen'],
        fontSize: 9.0,
        lineHeight: 10.7,
        fontWeight: 645,
        letterSpacing: 0.03,
        textRadiusAdjust: 0,
        iconRadiusAdjust: -2
      };

    case 'invoices':
      return {
        lines: ['Rechnungen'],
        fontSize: 8.5,
        lineHeight: 10.2,
        fontWeight: 640,
        letterSpacing: 0.01,
        textRadiusAdjust: -1,
        iconRadiusAdjust: -1
      };

    case 'shopping':
      return {
        lines: ['Einkaufs', 'liste'],
        fontSize: 8.1,
        lineHeight: 9.7,
        fontWeight: 635,
        letterSpacing: 0.01,
        textRadiusAdjust: -1,
        iconRadiusAdjust: 0
      };

    case 'coreteam':
      return {
        lines: ['Kernteam'],
        fontSize: 8.9,
        lineHeight: 10.5,
        fontWeight: 640,
        letterSpacing: 0.03,
        textRadiusAdjust: -1,
        iconRadiusAdjust: -1
      };

    case 'chatlog':
      return {
        lines: ['Projekt', 'Chat'],
        fontSize: 8.1,
        lineHeight: 9.7,
        fontWeight: 635,
        letterSpacing: 0.02,
        textRadiusAdjust: -1,
        iconRadiusAdjust: 0
      };

    case 'pos':
      return {
        lines: ['Bonier', 'system'],
        fontSize: 8.1,
        lineHeight: 9.7,
        fontWeight: 635,
        letterSpacing: 0.01,
        textRadiusAdjust: -1,
        iconRadiusAdjust: 0
      };

    case 'next':
    case 'chat-next':
      return {
        lines: ['Weiter'],
        fontSize: 9.0,
        lineHeight: 10.5,
        fontWeight: 650,
        letterSpacing: 0.04,
        textRadiusAdjust: 0,
        iconRadiusAdjust: -2
      };

    case 'prev':
    case 'chat-prev':
      return {
        lines: ['Zurück'],
        fontSize: 9.0,
        lineHeight: 10.5,
        fontWeight: 650,
        letterSpacing: 0.04,
        textRadiusAdjust: 0,
        iconRadiusAdjust: -2
      };

    case 'empty':
      return {
        lines: ['Freier', 'Slot'],
        fontSize: 8.0,
        lineHeight: 9.6,
        fontWeight: 620,
        letterSpacing: 0.02,
        textRadiusAdjust: -1,
        iconRadiusAdjust: 0
      };

    case 'chat-group': {
      const lines = genericWrap(item.label, 9);
      return {
        lines,
        fontSize: lines.length > 1 ? 7.9 : 8.4,
        lineHeight: 9.5,
        fontWeight: 620,
        letterSpacing: 0.01,
        textRadiusAdjust: -1,
        iconRadiusAdjust: 0
      };
    }

    case 'project': {
      const lines = genericWrap(item.label, 9);
      return {
        lines,
        fontSize: lines.length > 1 ? 7.9 : 8.4,
        lineHeight: 9.5,
        fontWeight: 620,
        letterSpacing: 0.01,
        textRadiusAdjust: -1,
        iconRadiusAdjust: 0
      };
    }

    default: {
      const lines = genericWrap(item.label, 9);
      return {
        lines,
        fontSize: lines.length > 1 ? 8.0 : 8.5,
        lineHeight: 9.6,
        fontWeight: 620,
        letterSpacing: 0.01,
        textRadiusAdjust: -1,
        iconRadiusAdjust: 0
      };
    }
  }
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
  const svgRef = useRef<SVGSVGElement>(null);

  const isDraggingRef = useRef(false);
  const lastPointerAngleRef = useRef<number | null>(null);
  const lastPointerTimeRef = useRef<number>(0);
  const suppressClickRef = useRef(false);
  const inertiaFrameRef = useRef<number | null>(null);
  const inertiaVelocityRef = useRef<number>(0);
  const inertiaLastTimeRef = useRef<number | null>(null);
  const autoRotationFrameRef = useRef<number | null>(null);

  const [manualRotation, setManualRotation] = useState(0);
  const [autoRotation, setAutoRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [wheelAnimationEnabled, setWheelAnimationEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(LS_WHEEL_ANIMATION_ENABLED);
    return stored === null ? true : stored === 'true';
  });
  const [isMobileView, setIsMobileView] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 640;
  });

  void wheelColors;
  void labelRadius;

  const wheelCx = center;
  const wheelCy = center - 18;
  const totalRotation = manualRotation + autoRotation;
  const wheelScale = isMobileView ? 1.16 : 1;

  const outerRadius = Math.max(148, buttonRadius - 12);
  const innerRadiusWithGap = Math.max(centerRadius + 14, 84);
  const visualCenterRadius = Math.max(centerRadius - 8, 62);
  const outerRingShadowRadius = outerRadius + 18;

  const ringThickness = outerRadius - innerRadiusWithGap;
  const bandMidRadius = innerRadiusWithGap + ringThickness * 0.43;

  const baseIconRadius = bandMidRadius - 15;
  const baseTextRadius = bandMidRadius + 16;

  const segmentGapAngle = 9.5;

  const actionCount = useMemo(
    () => wheelItems.filter((item) => item.slotType === 'action').length,
    [wheelItems]
  );

  const interactiveSlots = useMemo(
    () => new Set<ProjectsWheelDisplayItem['slotType']>(['project', 'action', 'next', 'prev']),
    []
  );

  const centerMetaTop = useMemo(() => {
    if (actionCount > 0) return `${actionCount} Module aktiv`;
    return '';
  }, [actionCount]);

  const progressValue = useMemo(() => {
    if (actionCount > 0) return 75;
    return null;
  }, [actionCount]);

  const getSvgPointFromClient = (clientX: number, clientY: number): Point | null => {
    const svg = svgRef.current;
    if (!svg) return null;

    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    return {
      x: ((clientX - rect.left) / rect.width) * 400,
      y: ((clientY - rect.top) / rect.height) * 420
    };
  };

  const getPointerAngle = (clientX: number, clientY: number): number | null => {
    const point = getSvgPointFromClient(clientX, clientY);
    if (!point) return null;

    return (Math.atan2(point.y - wheelCy, point.x - wheelCx) * 180) / Math.PI;
  };

  const stopInertia = () => {
    if (inertiaFrameRef.current !== null) {
      cancelAnimationFrame(inertiaFrameRef.current);
      inertiaFrameRef.current = null;
    }
    inertiaLastTimeRef.current = null;
  };

  const stopAutoRotationAnimation = () => {
    if (autoRotationFrameRef.current !== null) {
      cancelAnimationFrame(autoRotationFrameRef.current);
      autoRotationFrameRef.current = null;
    }
  };

  const startInertia = () => {
    stopInertia();

    if (Math.abs(inertiaVelocityRef.current) < 0.01) {
      inertiaVelocityRef.current = 0;
      return;
    }

    const step = (timestamp: number) => {
      if (inertiaLastTimeRef.current === null) {
        inertiaLastTimeRef.current = timestamp;
        inertiaFrameRef.current = requestAnimationFrame(step);
        return;
      }

      const dt = timestamp - inertiaLastTimeRef.current;
      inertiaLastTimeRef.current = timestamp;

      if (dt <= 0) {
        inertiaFrameRef.current = requestAnimationFrame(step);
        return;
      }

      setManualRotation((prev) => prev + inertiaVelocityRef.current * dt);

      const damping = Math.pow(0.92, dt / 16.6667);
      inertiaVelocityRef.current *= damping;

      if (Math.abs(inertiaVelocityRef.current) < 0.0025) {
        inertiaVelocityRef.current = 0;
        stopInertia();
        return;
      }

      inertiaFrameRef.current = requestAnimationFrame(step);
    };

    inertiaFrameRef.current = requestAnimationFrame(step);
  };

  const handleWheelPointerDown = (event: React.PointerEvent<SVGGElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    const startAngle = getPointerAngle(event.clientX, event.clientY);
    if (startAngle === null) return;

    stopInertia();
    inertiaVelocityRef.current = 0;

    isDraggingRef.current = true;
    setIsDragging(true);
    lastPointerAngleRef.current = startAngle;
    lastPointerTimeRef.current = performance.now();
    suppressClickRef.current = false;
    setHoveredIndex(null);

    event.preventDefault();
  };

  const handleSafeWheelClick = (item: ProjectsWheelDisplayItem) => {
    if (suppressClickRef.current) return;
    handleWheelClick(item);
  };

  const handleSafeCenterClick = () => {
    if (suppressClickRef.current) return;
    onCenterClick?.();
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 640);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const syncWheelAnimationSetting = () => {
      const stored = localStorage.getItem(LS_WHEEL_ANIMATION_ENABLED);
      setWheelAnimationEnabled(stored === null ? true : stored === 'true');
    };

    syncWheelAnimationSetting();

    window.addEventListener('focus', syncWheelAnimationSetting);
    window.addEventListener('storage', syncWheelAnimationSetting);
    document.addEventListener('visibilitychange', syncWheelAnimationSetting);

    return () => {
      window.removeEventListener('focus', syncWheelAnimationSetting);
      window.removeEventListener('storage', syncWheelAnimationSetting);
      document.removeEventListener('visibilitychange', syncWheelAnimationSetting);
    };
  }, []);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!isDraggingRef.current || lastPointerAngleRef.current === null) return;

      const currentAngle = getPointerAngle(event.clientX, event.clientY);
      if (currentAngle === null) return;

      let delta = currentAngle - lastPointerAngleRef.current;

      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;

      const now = performance.now();
      const dt = Math.max(1, now - lastPointerTimeRef.current);

      if (Math.abs(delta) > 0.05) {
        setManualRotation((prev) => prev + delta);

        const instantVelocity = delta / dt;
        inertiaVelocityRef.current =
          inertiaVelocityRef.current * 0.72 + instantVelocity * 0.28;

        if (Math.abs(delta) > 0.3) {
          suppressClickRef.current = true;
        }
      }

      lastPointerAngleRef.current = currentAngle;
      lastPointerTimeRef.current = now;
      event.preventDefault();
    };

    const stopDragging = () => {
      if (!isDraggingRef.current) return;

      isDraggingRef.current = false;
      setIsDragging(false);
      lastPointerAngleRef.current = null;

      startInertia();

      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', stopDragging);
    window.addEventListener('pointercancel', stopDragging);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopDragging);
      window.removeEventListener('pointercancel', stopDragging);
    };
  }, [wheelCx, wheelCy]);

  useEffect(() => {
    return () => {
      stopInertia();
      stopAutoRotationAnimation();
    };
  }, []);

  useEffect(() => {
    stopAutoRotationAnimation();
    setAutoRotation(0);

    if (!wheelAnimationEnabled) {
      return;
    }

    if (animationKey <= 0) return;
    if (animationKey === lastPlayedAnimationKey) return;

    lastPlayedAnimationKey = animationKey;

    const duration = 2800;
    const startTime = performance.now();

    const easeInOut = (t: number) => {
      return 0.5 * (1 - Math.cos(Math.PI * t));
    };

    const step = (timestamp: number) => {
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeInOut(progress);

      setAutoRotation(360 * eased);

      if (progress < 1) {
        autoRotationFrameRef.current = requestAnimationFrame(step);
        return;
      }

      setAutoRotation(0);
      autoRotationFrameRef.current = null;
    };

    autoRotationFrameRef.current = requestAnimationFrame(step);

    return () => {
      stopAutoRotationAnimation();
      setAutoRotation(0);
    };
  }, [animationKey, wheelAnimationEnabled]);

  const getSegmentPalette = (item: ProjectsWheelDisplayItem, index: number) => {
    const isHovered = hoveredIndex === index;
    const isHighlighted = isHovered;

    if (item.slotType === 'empty') {
      return {
        baseFill: 'url(#segmentEmptyGradient)',
        midFill: 'url(#segmentMiddleGlowMuted)',
        topFill: 'url(#segmentTopLightDark)',
        bottomFill: 'url(#segmentBottomShadeDark)',
        bodyHighlightOpacity: 0,
        stroke: 'rgba(255,255,255,0.035)',
        text: '#788292',
        icon: '#8791A1',
        opacity: 0.56,
        filter: 'url(#segmentShadowSoft)',
        innerStroke: 'rgba(255,255,255,0.03)',
        glow: false
      };
    }

    if (item.slotType === 'locked') {
      return {
        baseFill: 'url(#segmentLockedGradient)',
        midFill: 'url(#segmentMiddleGlowMuted)',
        topFill: 'url(#segmentTopLightDark)',
        bottomFill: 'url(#segmentBottomShadeDark)',
        bodyHighlightOpacity: 0,
        stroke: 'rgba(255,255,255,0.045)',
        text: '#94A0B0',
        icon: '#A3AFBE',
        opacity: 0.82,
        filter: 'url(#segmentShadowSoft)',
        innerStroke: 'rgba(255,255,255,0.04)',
        glow: false
      };
    }

    if (item.slotType === 'next' || item.slotType === 'prev') {
      return {
        baseFill: isHighlighted ? 'url(#segmentHighlightGradient)' : 'url(#segmentProjectGradient)',
        midFill: isHighlighted ? 'url(#segmentMiddleGlowHighlight)' : 'url(#segmentMiddleGlowNeutral)',
        topFill: isHighlighted ? 'url(#segmentTopLightHighlight)' : 'url(#segmentTopLightDark)',
        bottomFill: isHighlighted ? 'url(#segmentBottomShadeHighlight)' : 'url(#segmentBottomShadeDark)',
        bodyHighlightOpacity: isHighlighted ? 0.52 : 0,
        stroke: isHighlighted ? 'rgba(255,222,162,0.82)' : 'rgba(255,255,255,0.055)',
        text: isHighlighted ? '#FFF8EC' : '#E2E8F0',
        icon: isHighlighted ? '#FFE1A6' : '#CBD5E1',
        opacity: 1,
        filter: isHighlighted ? 'url(#segmentGlowStrong)' : 'url(#segmentShadowSoft)',
        innerStroke: isHighlighted ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.06)',
        glow: isHighlighted
      };
    }

    if (item.slotType === 'action') {
      return {
        baseFill: isHighlighted ? 'url(#segmentHighlightGradient)' : 'url(#segmentProjectGradient)',
        midFill: isHighlighted ? 'url(#segmentMiddleGlowHighlight)' : 'url(#segmentMiddleGlowNeutral)',
        topFill: isHighlighted ? 'url(#segmentTopLightHighlight)' : 'url(#segmentTopLightDark)',
        bottomFill: isHighlighted ? 'url(#segmentBottomShadeHighlight)' : 'url(#segmentBottomShadeDark)',
        bodyHighlightOpacity: isHighlighted ? 0.54 : 0,
        stroke: isHighlighted ? 'rgba(255,224,170,0.88)' : 'rgba(255,255,255,0.06)',
        text: isHighlighted ? '#FFF9EE' : '#EEF2F7',
        icon: isHighlighted ? '#FFE5B2' : '#D6DEE8',
        opacity: 1,
        filter: isHighlighted ? 'url(#segmentGlowStrong)' : 'url(#segmentShadowSoft)',
        innerStroke: isHighlighted ? 'rgba(255,255,255,0.24)' : 'rgba(255,255,255,0.065)',
        glow: isHighlighted
      };
    }

    if (item.slotType === 'project') {
      return {
        baseFill: isHovered ? 'url(#segmentHighlightGradient)' : 'url(#segmentProjectGradient)',
        midFill: isHovered ? 'url(#segmentMiddleGlowHighlight)' : 'url(#segmentMiddleGlowNeutral)',
        topFill: isHovered ? 'url(#segmentTopLightHighlight)' : 'url(#segmentTopLightDark)',
        bottomFill: isHovered ? 'url(#segmentBottomShadeHighlight)' : 'url(#segmentBottomShadeDark)',
        bodyHighlightOpacity: isHovered ? 0.58 : 0,
        stroke: isHovered ? 'rgba(255,224,170,0.88)' : 'rgba(255,255,255,0.06)',
        text: isHovered ? '#FFF9EE' : '#EFF4FA',
        icon: isHovered ? '#FFE5B2' : '#D9E0EA',
        opacity: 1,
        filter: isHovered ? 'url(#segmentGlowStrong)' : 'url(#segmentShadowSoft)',
        innerStroke: isHovered ? 'rgba(255,255,255,0.24)' : 'rgba(255,255,255,0.06)',
        glow: isHovered
      };
    }

    return {
      baseFill: 'url(#segmentProjectGradient)',
      midFill: 'url(#segmentMiddleGlowNeutral)',
      topFill: 'url(#segmentTopLightDark)',
      bottomFill: 'url(#segmentBottomShadeDark)',
      bodyHighlightOpacity: 0,
      stroke: 'rgba(255,255,255,0.06)',
      text: '#EFF4FA',
      icon: '#D9E0EA',
      opacity: 1,
      filter: 'url(#segmentShadowSoft)',
      innerStroke: 'rgba(255,255,255,0.06)',
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
      size: 16,
      strokeWidth: 2,
      color
    };

    switch (item.actionKey) {
      case 'calendar':
        return <CalendarDays {...common} x={x - 8} y={y - 8} />;
      case 'tasks':
        return <CheckSquare {...common} x={x - 8} y={y - 8} />;
      case 'polls':
        return <BarChart3 {...common} x={x - 8} y={y - 8} />;
      case 'invoices':
        return <Receipt {...common} x={x - 8} y={y - 8} />;
      case 'shopping':
        return <ShoppingCart {...common} x={x - 8} y={y - 8} />;
      case 'coreteam':
        return <Users {...common} x={x - 8} y={y - 8} />;
      case 'chatlog':
      case 'chat-group':
        return <MessageCircle {...common} x={x - 8} y={y - 8} />;
      case 'pos':
        return <Wallet {...common} x={x - 8} y={y - 8} />;
      case 'next':
      case 'chat-next':
        return <ChevronRight {...common} x={x - 8} y={y - 8} />;
      case 'prev':
      case 'chat-prev':
        return <ChevronLeft {...common} x={x - 8} y={y - 8} />;
      case 'empty':
        return <FolderKanban {...common} x={x - 8} y={y - 8} />;
      default:
        if (item.slotType === 'locked') {
          return <Lock {...common} x={x - 8} y={y - 8} />;
        }
        return <FolderKanban {...common} x={x - 8} y={y - 8} />;
    }
  };

  return (
    <div className="flex justify-center items-center py-4 px-1">
      <svg
        ref={svgRef}
        width="100%"
        viewBox="-20 -24 440 468"
        role="img"
        aria-label="Projekt Radmenü"
        style={{
          touchAction: 'none',
          maxWidth: isMobileView ? '430px' : '400px',
          height: 'auto',
          overflow: 'visible',
          display: 'block'
        }}
      >
        <defs>
          <radialGradient id="segmentProjectGradient" cx="35%" cy="28%" r="86%">
            <stop offset="0%" stopColor="#243245" />
            <stop offset="42%" stopColor="#101722" />
            <stop offset="100%" stopColor="#0A1018" />
          </radialGradient>

          <radialGradient id="segmentProjectGradientHover" cx="35%" cy="28%" r="86%">
            <stop offset="0%" stopColor="#36485F" />
            <stop offset="40%" stopColor="#17212F" />
            <stop offset="100%" stopColor="#0F151E" />
          </radialGradient>

          <radialGradient id="segmentHighlightGradient" cx="34%" cy="24%" r="84%">
            <stop offset="0%" stopColor="#FFF1CC" />
            <stop offset="24%" stopColor="#FFD98F" />
            <stop offset="58%" stopColor="#F0B347" />
            <stop offset="100%" stopColor="#BF7417" />
          </radialGradient>

          <radialGradient id="segmentBodyHighlight" cx="50%" cy="52%" r="54%">
            <stop offset="0%" stopColor="#FFF8E8" stopOpacity="0.92" />
            <stop offset="22%" stopColor="#FFE7B0" stopOpacity="0.58" />
            <stop offset="48%" stopColor="#FFC95C" stopOpacity="0.26" />
            <stop offset="74%" stopColor="#F0B347" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#F0B347" stopOpacity="0" />
          </radialGradient>

          <radialGradient id="segmentMiddleGlowNeutral" cx="50%" cy="50%" r="40%">
            <stop offset="0%" stopColor="rgba(132,176,232,0.13)" />
            <stop offset="32%" stopColor="rgba(95,142,198,0.06)" />
            <stop offset="72%" stopColor="rgba(95,142,198,0.015)" />
            <stop offset="100%" stopColor="rgba(95,142,198,0)" />
          </radialGradient>

          <radialGradient id="segmentMiddleGlowHover" cx="50%" cy="50%" r="42%">
            <stop offset="0%" stopColor="rgba(255,219,148,0.18)" />
            <stop offset="28%" stopColor="rgba(255,219,148,0.08)" />
            <stop offset="72%" stopColor="rgba(255,219,148,0.02)" />
            <stop offset="100%" stopColor="rgba(255,219,148,0)" />
          </radialGradient>

          <radialGradient id="segmentMiddleGlowHighlight" cx="50%" cy="50%" r="44%">
            <stop offset="0%" stopColor="rgba(255,245,220,0.26)" />
            <stop offset="28%" stopColor="rgba(255,214,130,0.18)" />
            <stop offset="54%" stopColor="rgba(245,179,74,0.09)" />
            <stop offset="100%" stopColor="rgba(245,179,74,0)" />
          </radialGradient>

          <radialGradient id="segmentMiddleGlowMuted" cx="50%" cy="50%" r="36%">
            <stop offset="0%" stopColor="rgba(160,180,205,0.06)" />
            <stop offset="42%" stopColor="rgba(160,180,205,0.02)" />
            <stop offset="100%" stopColor="rgba(160,180,205,0)" />
          </radialGradient>

          <linearGradient id="segmentTopLightDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.13)" />
            <stop offset="22%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          <linearGradient id="segmentTopLightHover" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,236,196,0.12)" />
            <stop offset="28%" stopColor="rgba(255,236,196,0.04)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          <linearGradient id="segmentTopLightHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.34)" />
            <stop offset="22%" stopColor="rgba(255,245,225,0.14)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          <linearGradient id="segmentBottomShadeDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <stop offset="56%" stopColor="rgba(0,0,0,0.05)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.18)" />
          </linearGradient>

          <linearGradient id="segmentBottomShadeHover" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <stop offset="56%" stopColor="rgba(0,0,0,0.05)" />
            <stop offset="100%" stopColor="rgba(85,54,10,0.12)" />
          </linearGradient>

          <linearGradient id="segmentBottomShadeHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <stop offset="56%" stopColor="rgba(0,0,0,0.04)" />
            <stop offset="100%" stopColor="rgba(132,72,10,0.18)" />
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

          <filter id="wheelShadow" x="-45%" y="-45%" width="190%" height="190%">
            <feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#000000" floodOpacity="0.42" />
          </filter>

          <filter id="segmentShadowSoft" x="-45%" y="-45%" width="190%" height="190%">
            <feDropShadow dx="0" dy="7" stdDeviation="8" floodColor="#000000" floodOpacity="0.34" />
          </filter>

          <filter id="segmentGlowSoft" x="-90%" y="-90%" width="280%" height="280%">
            <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#F5B34A" floodOpacity="0.16" />
            <feDropShadow dx="0" dy="0" stdDeviation="22" floodColor="#F5B34A" floodOpacity="0.05" />
            <feDropShadow dx="0" dy="10" stdDeviation="11" floodColor="#000000" floodOpacity="0.18" />
          </filter>

          <filter id="segmentGlowStrong" x="-100%" y="-100%" width="300%" height="300%">
            <feDropShadow dx="0" dy="0" stdDeviation="9" floodColor="#F5B34A" floodOpacity="0.34" />
            <feDropShadow dx="0" dy="0" stdDeviation="18" floodColor="#F5B34A" floodOpacity="0.16" />
            <feDropShadow dx="0" dy="0" stdDeviation="30" floodColor="#F5B34A" floodOpacity="0.06" />
            <feDropShadow dx="0" dy="10" stdDeviation="11" floodColor="#000000" floodOpacity="0.22" />
          </filter>

          <filter id="ringGlow" x="-90%" y="-90%" width="280%" height="280%">
            <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#F5B34A" floodOpacity="0.12" />
            <feDropShadow dx="0" dy="0" stdDeviation="24" floodColor="#F5B34A" floodOpacity="0.06" />
          </filter>

          <filter id="centerShadow" x="-60%" y="-60%" width="220%" height="220%">
            <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#000000" floodOpacity="0.42" />
          </filter>
        </defs>

        <g transform={`translate(${wheelCx} ${wheelCy}) scale(${wheelScale}) translate(${-wheelCx} ${-wheelCy})`}>
          <g
            transform={`rotate(${totalRotation} ${wheelCx} ${wheelCy})`}
            onPointerDown={handleWheelPointerDown}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
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

            <circle
              cx={wheelCx}
              cy={wheelCy}
              r={outerRadius - 2}
              fill="none"
              stroke="rgba(255,218,150,0.03)"
              strokeWidth="1"
            />

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

              const isHovered = hoveredIndex === i;
              const palette = getSegmentPalette(item, i);
              const isClickable = interactiveSlots.has(item.slotType);

              const lift = getSliceLift(i, wheelItems.length);
              const translateX = isHovered ? lift.dx * 0.92 : lift.dx * 0.22;
              const translateY = isHovered ? lift.dy * 0.92 : lift.dy * 0.22;

              const layout = getLabelLayout(item);
              const iconPoint = polarToCartesian(
                wheelCx,
                wheelCy,
                baseIconRadius + layout.iconRadiusAdjust,
                (startAngle + endAngle) / 2
              );
              const textPoint = polarToCartesian(
                wheelCx,
                wheelCy,
                baseTextRadius + layout.textRadiusAdjust,
                (startAngle + endAngle) / 2
              );

              const textStartY =
                layout.lines.length > 1
                  ? textPoint.y - ((layout.lines.length - 1) * (layout.lineHeight / 2))
                  : textPoint.y;

              return (
                <g
                  key={`${item.actionKey}-${item.projectId ?? i}`}
                  onClick={() => isClickable && handleSafeWheelClick(item)}
                  onMouseEnter={() => isClickable && !isDragging && setHoveredIndex(i)}
                  onMouseLeave={() => !isDragging && setHoveredIndex(null)}
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
                      stroke="rgba(245,179,74,0.38)"
                      strokeWidth="3.3"
                      opacity="0.84"
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
                    fill={palette.midFill}
                    opacity={1}
                  />

                  {palette.bodyHighlightOpacity > 0 && (
                    <path
                      d={path}
                      fill="url(#segmentBodyHighlight)"
                      opacity={palette.bodyHighlightOpacity}
                    />
                  )}

                  <path
                    d={path}
                    fill={palette.topFill}
                    opacity={palette.glow ? 0.98 : 0.82}
                  />

                  <path
                    d={path}
                    fill={palette.bottomFill}
                    opacity={0.95}
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
                        ? 'rgba(255,248,232,0.22)'
                        : 'rgba(255,255,255,0.035)'
                    }
                    strokeWidth={0.5}
                    opacity={0.9}
                  />

                  {renderIcon(item, iconPoint.x, iconPoint.y, palette.icon)}

                  <g
                    transform={`rotate(${-totalRotation} ${textPoint.x} ${textPoint.y})`}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    <text
                      x={textPoint.x}
                      y={textStartY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={palette.text}
                      fontWeight={layout.fontWeight}
                      fontSize={layout.fontSize}
                      letterSpacing={layout.letterSpacing}
                    >
                      {layout.lines.map((line, idx) => (
                        <tspan
                          key={idx}
                          x={textPoint.x}
                          dy={idx === 0 ? 0 : layout.lineHeight}
                        >
                          {line}
                        </tspan>
                      ))}
                    </text>
                  </g>
                </g>
              );
            })}

            <g onClick={handleSafeCenterClick} style={{ cursor: onCenterClick ? 'pointer' : 'default' }}>
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

              <g
                transform={`rotate(${-totalRotation} ${wheelCx} ${wheelCy})`}
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                <text
                  x={wheelCx}
                  y={wheelCy - 4}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#FAFBFD"
                  fontWeight="700"
                  fontSize="11.4"
                  letterSpacing="0.08"
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
                  >
                    {centerSubLabel}
                  </text>
                )}

                {progressValue !== null && (
                  <>
                    <path
                      d={arcPath(polarToCartesian, wheelCx, wheelCy + 48, 18.5, 270, 90, 1)}
                      fill="none"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                    />
                    <path
                      d={arcPath(polarToCartesian, wheelCx, wheelCy + 48, 18.5, 270, 90, 1)}
                      fill="none"
                      stroke="url(#segmentHighlightGradient)"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      pathLength={100}
                      strokeDasharray={100}
                      strokeDashoffset={100 - progressValue}
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
                    >
                      {progressValue}%
                    </text>
                  </>
                )}
              </g>
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
};

export default ProjectsWheelMenu;

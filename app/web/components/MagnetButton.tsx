/**
 * MagnetButton - magnet pull effect from reactbits.dev/animations/magnet
 * Wraps children and applies a subtle "magnet" effect toward the cursor on hover.
 * Web only.
 */

import React, { useRef, useState, useCallback, type ReactNode } from 'react';

export type MagnetButtonProps = {
  children: ReactNode;
  padding?: number;
  magnetStrength?: number;
  activeTransition?: string;
  inactiveTransition?: string;
  style?: React.CSSProperties;
};

export default function MagnetButton({
  children,
  padding = 100,
  magnetStrength = 2,
  activeTransition = 'transform 0.3s ease-out',
  inactiveTransition = 'transform 0.5s ease-in-out',
  style,
}: MagnetButtonProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      const rect = wrapper.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= padding) {
        const pull = 1 - distance / padding;
        const strength = 1 / magnetStrength;
        const moveX = dx * pull * strength;
        const moveY = dy * pull * strength;
        setTransform({ x: moveX, y: moveY });
        setIsActive(true);
      } else {
        setTransform({ x: 0, y: 0 });
        setIsActive(false);
      }
    },
    [padding, magnetStrength]
  );

  const handleMouseLeave = useCallback(() => {
    setTransform({ x: 0, y: 0 });
    setIsActive(false);
  }, []);

  return (
    <div
      ref={wrapperRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        display: 'inline-block',
        padding: padding,
        margin: -padding,
        ...style,
      }}
    >
      <div
        style={{
          display: 'inline-block',
          transform: `translate(${transform.x}px, ${transform.y}px)`,
          transition: isActive ? activeTransition : inactiveTransition,
        }}
      >
        {children}
      </div>
    </div>
  );
}

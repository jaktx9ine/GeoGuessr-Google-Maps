import React, { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number; // duration of animation in ms, default to 1500ms
  className?: string;
  prefix?: string;
}

export function AnimatedCounter({ value, duration = 1200, className, prefix = '' }: AnimatedCounterProps) {
  const [count, setCount] = useState<number>(() => value);
  const prevValueRef = useRef<number>(value);
  const listTargetValueRef = useRef<number>(value);

  useEffect(() => {
    const start = prevValueRef.current;
    const end = value;
    listTargetValueRef.current = end;
    if (start === end) {
      setCount(end);
      return;
    }

    let startTime: number | null = null;
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const progressRatio = Math.min(progress / duration, 1);
      
      // Easing out quadratic for smooth slowing down at the end
      const easeOutQuad = (t: number) => t * (2 - t);
      const currentCount = Math.floor(start + (end - start) * easeOutQuad(progressRatio));

      setCount(currentCount);

      if (progressRatio < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setCount(end);
        prevValueRef.current = end;
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [value, duration]);

  // Keep track of any value updates to set as previous for next animation if interrupted
  useEffect(() => {
    return () => {
      prevValueRef.current = listTargetValueRef.current;
    };
  }, []);

  return <span className={className}>{prefix}{count.toLocaleString()}</span>;
}

import { useEffect, useRef, useState } from 'react';
import { animate } from 'motion';

interface AnimatedCounterProps {
  target: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  target,
  duration = 2,
  prefix = '',
  suffix = '',
  decimals = 0,
}) => {
  const [display, setDisplay] = useState<string>('0');
  const spanRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = spanRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            hasAnimated.current = true;

            animate(0, target, {
              duration,
              ease: [0.16, 1, 0.3, 1],
              onUpdate: (value) => {
                const formatted = Number(value.toFixed(decimals)).toLocaleString(
                  'en-IN',
                  {
                    minimumFractionDigits: decimals,
                    maximumFractionDigits: decimals,
                  }
                );
                setDisplay(formatted);
              },
            });
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [target, duration, decimals]);

  return (
    <span ref={spanRef}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
};

export default AnimatedCounter;

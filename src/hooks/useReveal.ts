import { useEffect, useRef, useState, type ReactNode } from 'react';
import * as React from 'react';

export function useReveal<T extends HTMLElement = HTMLDivElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(function () {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            setShown(true);
            obs.unobserve(entry.target);
          }
        });
      },
      Object.assign({ threshold: 0.12, rootMargin: '0px 0px -40px 0px' }, options || {}),
    );
    obs.observe(el);
    return function () {
      obs.disconnect();
    };
  }, []);

  return { ref: ref, shown: shown };
}

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}

export function Reveal(props: RevealProps) {
  const children = props.children;
  const className = props.className;
  const delay = props.delay;
  const y = props.y;
  const r = useReveal<HTMLDivElement>();
  const isShown = r.shown;
  const base = 'transition-all duration-700 ease-out ' + (className ?? '');
  const translateY = (y ?? 24);
  const styleShown: React.CSSProperties = {
    transitionDelay: (delay ?? 0) + 'ms',
    opacity: 1,
    transform: 'translateY(0px)',
  };
  const styleHidden: React.CSSProperties = {
    transitionDelay: (delay ?? 0) + 'ms',
    opacity: 0,
    transform: 'translateY(' + translateY + 'px)',
  };
  const style = isShown ? styleShown : styleHidden;
  const divProps = { ref: r.ref, className: base, style: style, children: children };
  return React.createElement('div', divProps);
}

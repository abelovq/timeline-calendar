import { RefObject, useEffect, useState } from 'react';

export const useHover = <T extends HTMLElement>(ref: RefObject<T>) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current as HTMLElement;

    el.addEventListener('mouseenter', handleMouseEnter);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mouseenter', handleMouseLeave);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [ref]);

  return isHovered;
};

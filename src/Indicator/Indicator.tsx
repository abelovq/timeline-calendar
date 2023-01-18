import { useLayoutEffect, useRef, useState } from 'react';

interface ITimelineIndicator {
  pos: number;
  value: string;
}
export const TimelineIndicator = ({ pos, value }: ITimelineIndicator) => {
  const ref = useRef<HTMLDivElement | null>(null);

  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    setHeight(document.documentElement.clientHeight - 80);
  }, []);

  return (
    <div ref={ref} style={{ height }} className="timeline-block__indicator">
      <span style={{ left: `${pos}px` }} className="time-indicator">
        {value}
      </span>
    </div>
  );
};

import { memo, useRef } from 'react';

import './styles.scss';

interface ITimelineInterval {
  interval: string;
  intervalBy?: number;
}

export const TimelineInterval = memo(function TimelineInterval({
  interval,
  intervalBy = 15,
}: ITimelineInterval) {
  const ref = useRef<HTMLDivElement | null>(null);

  return (
    <div ref={ref} className="timeline-interval">
      <span> {interval}</span>
    </div>
  );
});

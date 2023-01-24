import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import classNames from 'classnames';
import debounce from 'lodash/debounce';

import { Resources } from '../Resources';
import { ITimeEvent, IResource } from '../interfaces';
import { getCurrentWeekDays, minusWeek, plusWeek } from '../utils/dates';
import { cacheWrapper, getMaxKey, transformToMap } from '../utils/misc';
import {
  filterData,
  filterNewEvents,
  ITimeEventWithCoordsMap,
  mapDefaultEventToEventOrigin,
} from '../utils/render';
import {
  getNearestNum,
  getTimeByCoords,
  getTimeMap,
  intervals,
} from '../utils/coords';
import { TimelineCompProvider } from '../TimelineCalendarContext';
import { TimelineIndicator } from '../Indicator';
import { TimelineInterval } from '../TimelineInterval/TimelineInterval';
import { TimeEvent } from '../TimeEvent/TimeEvent';

import './styles.scss';

interface ITimelineCalendarProps {
  defaultEvents: ITimeEvent[];
  resources: IResource[];
  onAddEvent?: (data: any) => void;
  onDeleteEvent?: (data: any) => void;
  className?: string;
  onEventClick?: (data: any) => void;
}

const init = { visible: 'hidden', left: 0, value: '' };

export const TimelineCalendar = ({
  defaultEvents = [],
  resources,
  onAddEvent,
  onDeleteEvent,
  onEventClick,
  className,
}: ITimelineCalendarProps) => {
  const initialId = useRef(defaultEvents.length || 1);
  const firstRender = useRef(true);
  const eventsRef = useRef<null | HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const timelineScrollBlock = useRef<HTMLDivElement | null>(null);
  const timelineCalendar = useRef<HTMLDivElement | null>(null);

  const [intersectedId, setIntersectedId] = useState(() =>
    new Date().getDate()
  );

  const scrollPosRef = useRef(0);
  const [scrollDir, setScrollDir] = useState('right');
  const topLeftStickyBlockRef = useRef<HTMLDivElement | null>(null);

  const timelinePeriodRef = useRef<{ [id: string]: HTMLDivElement }>({});

  const [weekStartDate, setWeekStartDate] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0);
    today.setMinutes(0);
    today.setSeconds(0);
    return today;
  });

  const [dataEvents, setDataEvents] = useState<ITimeEventWithCoordsMap>(() => {
    const dataEvents = transformToMap(defaultEvents, initialId.current);
    const newDataWithEventOrigin = mapDefaultEventToEventOrigin(
      dataEvents,
      resources,
      weekStartDate
    );
    return newDataWithEventOrigin;
  });

  const [timeIndicator, setTimeIndicator] = useState(init);
  const [activeEventId, setActiveEventId] = useState<number | null>(null);

  const maxKey = useMemo(() => getMaxKey(dataEvents), [dataEvents]);

  useEffect(() => {
    if (!firstRender.current) {
      // if we sync state need to filter from existed events whick already in dataEvents (defaultEvents)
      const newEvents = filterNewEvents(defaultEvents, dataEvents);
      const newEventsMap = transformToMap(newEvents, maxKey);

      const newDataWithEventOrigin = mapDefaultEventToEventOrigin(
        newEventsMap,
        resources,
        weekStartDate
      );
      setDataEvents((prev) => ({ ...prev, ...newDataWithEventOrigin }));
    }

    firstRender.current = false;
  }, [defaultEvents, initialId, weekStartDate, resources]);

  const visibleEvents = useMemo(() => {
    const newData = filterData({ dataEvents, weekStartDate, mode: 'week' });
    return newData;
  }, [dataEvents, weekStartDate]);

  const weekRange = useMemo(() => {
    return getCurrentWeekDays(new Date(weekStartDate));
  }, [weekStartDate]);

  useEffect(() => {
    const node = eventsRef.current;
    const body = bodyRef.current;
    if (!node || !body) return;

    const resources = node.previousElementSibling?.getBoundingClientRect();

    const fn = cacheWrapper(getTimeMap);

    const onMouseMove = debounce((e: MouseEvent) => {
      // TODO make getTimeByCoords with intervalBy e.g. 15 by default, 30 etc
      const posX =
        e.clientX - body.getBoundingClientRect().left - resources!.width;

      if (!node.contains(e.target as Node)) {
        setTimeIndicator(init);
        return;
      }

      const coefficient = Math.floor(posX / 1344);

      const coords = fn(coefficient);

      const [, value] = getTimeByCoords(posX, coefficient, weekStartDate);
      const left = getNearestNum(coords, posX);

      setTimeIndicator({ visible: 'visible', left, value });
    });

    document.addEventListener('mousemove', onMouseMove);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
    };
  }, [weekStartDate]);

  const goToWeek = (dir: 1 | -1) => {
    if (dir === -1) {
      const newWeek = minusWeek(weekStartDate);
      setWeekStartDate(newWeek);
      return;
    }

    const newWeek = plusWeek(weekStartDate);
    setWeekStartDate(newWeek);
  };

  const setEvent = useCallback(
    (event: any) => {
      if (onAddEvent) {
        onAddEvent(event);
      }
    },
    [onAddEvent]
  );

  const clickEvent = useCallback(
    (event: any) => {
      if (onEventClick) {
        onEventClick(event);
      }
    },
    [onEventClick]
  );

  const setDeleteEvent = useCallback(
    (deleteId: number) => {
      setDataEvents((prev) => {
        if (onDeleteEvent) {
          onDeleteEvent(prev[deleteId]);
        }
        delete prev[deleteId];
        return { ...prev };
      });
    },
    [onDeleteEvent]
  );

  const providerState = useMemo(() => {
    return {
      setEvent,
      setDeleteEvent,
      clickEvent,
      activeEventId,
      setActiveEventId,
    };
  }, [setEvent, setDeleteEvent, clickEvent, activeEventId]);

  const onScrollTimeline = (e: React.WheelEvent<HTMLDivElement>) => {
    const prevX = (e.target as HTMLDivElement).scrollLeft;
    const topLeftStickyBlock = topLeftStickyBlockRef.current;
    if (!topLeftStickyBlock) return;

    const topLeftStickyBlockWidth =
      topLeftStickyBlock.getBoundingClientRect().width;

    if (prevX < scrollPosRef.current) {
      setScrollDir('left');
    }
    if (prevX > scrollPosRef.current) {
      setScrollDir('right');
    }
    scrollPosRef.current = prevX;

    if (scrollDir === 'right') {
      const element = timelinePeriodRef.current[intersectedId];
      const elementNext = timelinePeriodRef.current[intersectedId + 1];

      const dateEl = element.querySelector('.timeline-cell') as HTMLDivElement;
      let { width: dateElWidth } = dateEl.getBoundingClientRect();
      let { left: nextElLeft = 0 } = elementNext?.getBoundingClientRect() ?? {};

      if (nextElLeft) {
        if (nextElLeft <= topLeftStickyBlockWidth + dateElWidth) {
          dateEl.style.left = `${nextElLeft - dateElWidth}px`;
        }
        if (nextElLeft <= topLeftStickyBlockWidth) {
          setIntersectedId((prev) => prev + 1);
        }
      }
    } else if (scrollDir === 'left') {
      const element = timelinePeriodRef.current[intersectedId];
      const elementPrev = timelinePeriodRef.current[intersectedId - 1];
      const elementNext = timelinePeriodRef.current[intersectedId + 1];

      const { left } = element.getBoundingClientRect();
      const { left: nextElLeft = 0 } =
        elementNext?.getBoundingClientRect() ?? {};

      if (elementPrev) {
        if (nextElLeft) {
          const dateElPrev =
            elementPrev.querySelector<HTMLDivElement>('.timeline-cell');
          const dateEl =
            element.querySelector<HTMLDivElement>('.timeline-cell');

          const { width } = dateElPrev!.getBoundingClientRect();

          dateEl!.style.left = `${nextElLeft - width}px`;
          if (nextElLeft - width >= topLeftStickyBlockWidth) {
            dateEl!.style.left = `${topLeftStickyBlockWidth}px`;
          }
        }

        if (left >= topLeftStickyBlockWidth) {
          setIntersectedId((prev) => prev - 1);
        }
      } else if (element) {
        if (left < topLeftStickyBlockWidth) {
          const dateEl =
            element.querySelector<HTMLDivElement>('.timeline-cell');
          const { width } = dateEl!.getBoundingClientRect();
          dateEl!.style.left = `${nextElLeft - width}px`;
          if (nextElLeft - width >= topLeftStickyBlockWidth) {
            dateEl!.style.left = `${topLeftStickyBlockWidth}px`;
          }
        }
      }
    }
  };

  return (
    <TimelineCompProvider value={providerState}>
      <div
        onScroll={onScrollTimeline}
        ref={timelineCalendar}
        className={classNames('wrapper', className)}
      >
        <div className="header timeline-block">
          <div ref={topLeftStickyBlockRef} className="timeline-cell--empty">
            <button onClick={() => goToWeek(-1)}>PREV WEEK</button>
            <button onClick={() => goToWeek(1)}>NEXT WEEK</button>
          </div>

          <div ref={timelineScrollBlock} className="timeline-block__scroll">
            <TimelineIndicator
              value={timeIndicator.value}
              pos={timeIndicator.left}
            />
            <div style={{ display: 'flex' }}>
              {weekRange.map((day) => {
                const id = +(day as string).match(/\d+/)!;
                const idStr = `timeline-period-${
                  (day as string).split(' ')[0]
                }`;
                return (
                  <div
                    ref={(el: HTMLDivElement) =>
                      (timelinePeriodRef.current[id] = el)
                    }
                    className="timeline-period"
                    key={day}
                    id={idStr}
                  >
                    <div
                      className="timeline-cell"
                      style={{
                        position: intersectedId === id ? 'fixed' : 'static',

                        left: 200,
                      }}
                    >
                      {day}
                    </div>
                    <div
                      style={{ marginTop: intersectedId === id ? 38 : 0 }}
                      className="timeline-time-interval"
                    >
                      {intervals.map((interval, i) => (
                        <TimelineInterval key={i} interval={interval} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', width: '100%', flex: 1 }}>
          <div ref={bodyRef} className="body">
            <Resources data={resources} />
            <div
              ref={eventsRef}
              style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
            >
              {resources.map((resource) => {
                const { id, color } = resource;
                return (
                  <TimeEvent
                    weekStartDate={weekStartDate}
                    weekRange={weekRange as string[]}
                    maxKey={maxKey}
                    key={resource.id}
                    value={timeIndicator.value}
                    id={id}
                    color={color}
                    events={visibleEvents}
                    setEvents={setDataEvents}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </TimelineCompProvider>
  );
};

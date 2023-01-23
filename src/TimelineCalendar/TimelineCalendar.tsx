import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
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

  return (
    <TimelineCompProvider value={providerState}>
      <div className={classNames('wrapper', className)}>
        <div className="header timeline-block">
          <div className="timeline-cell--empty">
            <button onClick={() => goToWeek(-1)}>PREV WEEK</button>
            <button onClick={() => goToWeek(1)}>NEXT WEEK</button>
          </div>

          <div className="timeline-block__scroll">
            <TimelineIndicator
              value={timeIndicator.value}
              pos={timeIndicator.left}
            />
            <div style={{ display: 'flex' }}>
              {weekRange.map((day) => {
                return (
                  <div className="timeline-period" key={day}>
                    <div className="timeline-cell">{day}</div>
                    <div className="timeline-time-interval">
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

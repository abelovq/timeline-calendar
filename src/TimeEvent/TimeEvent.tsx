import classNames from 'classnames';
import {
  Dispatch,
  KeyboardEvent,
  useRef,
  useState,
  useEffect,
  useCallback,
  memo,
} from 'react';

import { useHover } from '../hooks';
import { ITimeEventCoords } from '../interfaces';
import { useTimelineContext } from '../TimelineCalendarContext';
import { FormDelete } from '../ui/forms/FormDelete';
import { Modal } from '../ui/Modal';
import {
  cacheWrapper,
  getNearestNum,
  getTimeByCoords,
  getTimeMap,
  intervals,
} from '../utils/coords';
import { transformObjToCss } from '../utils/css';
import { ITimeEventWithCoordsMap, ITransformToMap } from '../utils/render';

import './styles.scss';

interface ITimeEvent {
  events: ITimeEventWithCoordsMap;
  id: number;
  setEvents: Dispatch<React.SetStateAction<ITimeEventWithCoordsMap>>;
  color: string;
  value: string;
  maxKey: number;
  weekRange: string[];
  weekStartDate: Date;
}

export const TimeEvent = memo(
  ({
    events,
    maxKey,
    id,
    setEvents,
    color,
    value,
    weekRange,
    weekStartDate,
  }: ITimeEvent) => {
    const { setEvent, setDeleteEvent, activeEventId, setActiveEventId } =
      useTimelineContext();

    const eventsRef = useRef<HTMLDivElement | null>(null);
    const sliderLeftRef = useRef<HTMLDivElement | null>(null);
    const sliderRightRef = useRef<HTMLDivElement | null>(null);

    // TODO block shadow
    const [isSliding, setIsSliding] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
      const eventsDiv = eventsRef.current;

      if (!eventsDiv) return;

      const fn = cacheWrapper(getTimeMap);

      const handleAddEvent = (e: MouseEvent) => {
        if ((e.target as HTMLElement).closest('.event-block')) {
          return;
        }

        let startPointX = e.clientX,
          h = 50,
          startPointY = e.clientY - eventsDiv.getBoundingClientRect().top;
        let newEvent = {};
        const onMousemove = (e: MouseEvent) => {
          let newW = e.clientX - startPointX;

          const coefficient = Math.floor(
            (e.clientX - eventsDiv.getBoundingClientRect().left) / 1344
          );

          const arr = fn(0);

          const finalWidth = getNearestNum(arr, Math.abs(newW));

          const [dateStart, , time24formatStart] = getTimeByCoords(
            startPointX - eventsDiv.getBoundingClientRect().left,
            coefficient,
            weekStartDate
          );
          const [dateEnd, time12formatEnd, time24formatEnd] = getTimeByCoords(
            e.clientX - eventsDiv.getBoundingClientRect().left,
            coefficient,
            weekStartDate
          );

          if (newW > 20) {
            newEvent = {
              eventOrigin: {
                posX: startPointX - eventsDiv.getBoundingClientRect().left,
                posY: startPointY - 5,
                h,
                w: finalWidth,
                bgColor: color,
              },
              resource: id,
              timeStart: value,
              timeEnd: time12formatEnd,
              start: `${dateStart}T${time24formatStart}`,
              end: `${dateEnd}T${time24formatEnd}`,
              title: 'New Event',
              color: '#9e9e9e',
              editable: false,
              hasEdit: false,
            };

            setEvents((prev) => ({ ...prev, [maxKey]: newEvent }));
          } else if (newW < 0) {
            newEvent = {
              eventOrigin: {
                posXRight:
                  eventsDiv.getBoundingClientRect().right - startPointX,
                posY: startPointY - 5,
                h,
                color: '#9e9e9e',
                editable: false,
                w: finalWidth,
                bgColor: color,
              },
              resource: id,
              timeStart: time12formatEnd,
              timeEnd: value,
              end: `${dateStart}T${time24formatStart}`,
              start: `${dateEnd}T${time24formatEnd}`,
              title: 'New Event',
              color: '#9e9e9e',
              editable: false,
              hasEdit: false,
            };

            setEvents((prev) => ({ ...prev, [maxKey]: newEvent }));
          }
        };

        const onMouseup = () => {
          eventsDiv.removeEventListener('mouseup', onMouseup);
          eventsDiv.removeEventListener('mousemove', onMousemove);
        };
        eventsDiv.addEventListener('mouseup', onMouseup);
        eventsDiv.addEventListener('mousemove', onMousemove);
      };

      eventsDiv.addEventListener('mousedown', handleAddEvent);

      return () => eventsDiv.removeEventListener('mousedown', handleAddEvent);
    }, [events, id, color, setEvents, setEvent, value]);

    const handleDrag = useCallback(
      (e: React.MouseEvent, id: number) => {
        const fn = cacheWrapper(getTimeMap);
        setActiveEventId(id);

        const eventsDiv = eventsRef.current;
        if (!eventsDiv) return;

        let eventBlockEl = (e.target as HTMLElement).closest(
          '.event-block'
        ) as HTMLElement;
        if (eventBlockEl !== null) {
          const { left: elementLeft, top: elementTop } =
            eventBlockEl.getBoundingClientRect();

          const shiftX = e.clientX - elementLeft;
          const shiftY = e.clientY - elementTop;
          let y = e.clientY;

          const onMousemove = (e: MouseEvent) => {
            const { left: elementLeft, right: elementRight } =
              eventBlockEl.getBoundingClientRect();
            const { left: eventsDivLeft } = eventsDiv.getBoundingClientRect();

            const coefficient = Math.floor(
              (elementLeft - eventsDivLeft) / 1344
            );

            const arr = fn(coefficient);

            if (id) {
              const [dateStart, time12formatStart, time24formatStart] =
                getTimeByCoords(
                  elementLeft - eventsDivLeft,
                  coefficient,
                  weekStartDate
                );
              const [dateEnd, time12formatEnd, time24formatEnd] =
                getTimeByCoords(
                  elementRight - eventsDivLeft,
                  coefficient,
                  weekStartDate
                );
              const posX = getNearestNum(
                arr,
                e.clientX - shiftX - eventsDivLeft
              );

              const newPos = {
                posX,
                posY:
                  y - eventsRef.current!.getBoundingClientRect().top - shiftY,
              };
              if (newPos.posX <= 0 || newPos.posY <= 0) return;

              setEvents((prev) => {
                delete prev[id].eventOrigin.posXRight;
                return {
                  ...prev,
                  [id]: {
                    ...prev[id],
                    timeStart: time12formatStart,
                    hasEdit: true,
                    timeEnd: time12formatEnd,
                    start: `${dateStart}T${time24formatStart}`,
                    end: `${dateEnd}T${time24formatEnd}`,
                    eventOrigin: { ...prev[id].eventOrigin, ...newPos },
                  },
                };
              });
            }
          };
          const onMouseup = (e: MouseEvent) => {
            document.removeEventListener('mousemove', onMousemove);
            eventBlockEl.removeEventListener('mouseup', onMouseup);
          };

          eventBlockEl.addEventListener('mouseup', onMouseup);
          document.addEventListener('mousemove', onMousemove);
        }
      },
      [setEvents]
    );

    const handleSlider = useCallback(
      (e: React.MouseEvent, id: number) => {
        e.stopPropagation();

        const fn = cacheWrapper(getTimeMap);

        const eventsDiv = eventsRef.current;
        const sliderLeftEl = sliderLeftRef.current;
        if (!eventsDiv || !sliderLeftEl) return;

        const slider = e.target as HTMLElement;
        const sliderName = slider.dataset.name;

        const currEventBlock = slider.closest('.event-block');

        if (currEventBlock) {
          setActiveEventId(id);

          const oldW = parseInt(getComputedStyle(currEventBlock).width, 10);

          const sliderRect = slider.getBoundingClientRect();
          const eventsDivRect = eventsDiv.getBoundingClientRect();
          const currEventBlockRect = currEventBlock.getBoundingClientRect();

          const onMousemove = (e: MouseEvent) => {
            const newCurrEventBlockRect =
              currEventBlock.getBoundingClientRect();
            if (sliderName === 'sliderLeft') {
              const startSliderPosX =
                sliderRect.left - eventsDivRect.left + slider.offsetWidth / 2;
              const newW = e.clientX - eventsDivRect.left - startSliderPosX;

              const coefficient = Math.floor(
                (e.clientX - eventsDivRect.left) / 1344
              );

              const arr = fn(0);

              const finalWidth = getNearestNum(arr, Math.abs(newW));

              const [dateStart, time12formatStart, time24formatStart] =
                getTimeByCoords(
                  newCurrEventBlockRect.left - eventsDivRect.left,
                  coefficient,
                  weekStartDate
                );
              setEvents((prev) => {
                delete prev[id].eventOrigin.posX;

                return {
                  ...prev,
                  [id]: {
                    ...prev[id],
                    timeStart: time12formatStart,
                    start: `${dateStart}T${time24formatStart}`,
                    hasEdit: true,
                    eventOrigin: {
                      ...prev[id].eventOrigin,
                      posXRight:
                        eventsDiv.getBoundingClientRect().right -
                        currEventBlockRect.right,
                      w: newW > 0 ? oldW - finalWidth : oldW + finalWidth,
                    },
                  },
                };
              });
            } else if (sliderName === 'sliderRight') {
              const startSliderPosX =
                sliderRect.right - eventsDivRect.left + slider.offsetWidth / 2;
              const newW = e.clientX - eventsDivRect.left - startSliderPosX;

              const coefficient = Math.floor(
                (e.clientX - eventsDivRect.left) / 1344
              );

              const arr = fn(0);

              const finalWidth = getNearestNum(arr, Math.abs(newW));

              const [dateEnd, time12formatEnd, time24formatEnd] =
                getTimeByCoords(
                  newCurrEventBlockRect.right - eventsDivRect.left,
                  coefficient,
                  weekStartDate
                );

              setEvents((prev) => {
                delete prev[id].eventOrigin.posXRight;
                return {
                  ...prev,
                  [id]: {
                    ...prev[id],
                    timeEnd: time12formatEnd,
                    hasEdit: true,
                    end: `${dateEnd}T${time24formatEnd}`,
                    eventOrigin: {
                      ...prev[id].eventOrigin,
                      posX:
                        currEventBlockRect.left -
                        eventsDiv.getBoundingClientRect().left,
                      w: newW > 0 ? oldW + finalWidth : oldW - finalWidth,
                    },
                  },
                };
              });
            }
          };

          const onMouseUp = () => {
            // setIsSliding(false);

            document.removeEventListener('mousemove', onMousemove);
            document.removeEventListener('mouseup', onMouseUp);
          };

          document.addEventListener('mouseup', onMouseUp);
          document.addEventListener('mousemove', onMousemove);
        }
      },
      [weekStartDate]
    );

    const handleClickToDeleteEvent = (
      e: KeyboardEvent<HTMLDivElement>,
      id: number
    ) => {
      if (e.key === 'Delete') {
        console.log('id', id);
        setIsModalOpen(true);
        setActiveEventId(id);
      }
    };

    const handleCloseModal = () => setIsModalOpen(false);

    const handleConfirmDelete = (value: boolean) => {
      console.log('activeEventId', activeEventId);
      setConfirmDelete(value);
      setDeleteEvent(activeEventId!);
      setActiveEventId(null);
      handleCloseModal();
    };

    const handleCancelDelete = (value: boolean) => {
      setConfirmDelete(value);
      handleCloseModal();
    };

    return (
      <div
        style={{
          display: 'flex',
          flex: 1,
          borderBottom: '1px solid #eee',
          position: 'relative',
        }}
      >
        <div ref={eventsRef} className="events">
          {Object.keys(events).map((key) => {
            const { resource, ...other } = events[key];
            if (id === resource) {
              return (
                <EventBlock
                  handleSlider={handleSlider}
                  sliderLeftRef={sliderLeftRef}
                  sliderRightRef={sliderRightRef}
                  key={key}
                  {...other}
                  id={+key}
                  handleDrag={handleDrag}
                  handleClickToDeleteEvent={handleClickToDeleteEvent}
                  isModalOpen={isModalOpen}
                />
              );
            }
            return null;
          })}
        </div>

        {weekRange.map((_, wIdx) => {
          return (
            <div key={wIdx} style={{ display: 'flex', flex: '1 0 auto' }}>
              {intervals.map((_, i) => (
                <div
                  key={`${i}-${wIdx}`}
                  style={{
                    width: 56,
                    height: '100%',
                    border: '1px solid #eee',
                  }}
                ></div>
              ))}
            </div>
          );
        })}
        <Modal isOpen={isModalOpen} onClose={handleCloseModal}>
          <FormDelete
            onHandleCancelClick={handleCancelDelete}
            onHandleConfirmClick={handleConfirmDelete}
          />
        </Modal>
      </div>
    );
  }
);

interface IEventBlockProps {
  handleDrag: (e: React.MouseEvent, id: number) => void;
  handleSlider: (e: React.MouseEvent, id: number) => void;
  handleClickToDeleteEvent: (
    e: React.KeyboardEvent<HTMLDivElement>,
    id: number
  ) => void;

  id: number;
  eventOrigin: ITimeEventCoords;
  title: string;
  timeStart: string;
  timeEnd: string;
  sliderLeftRef: any;
  sliderRightRef: any;
  isModalOpen?: boolean;
  // isSliding: boolean;
}

const EventBlock = memo((props: IEventBlockProps) => {
  const eventBlockRef = useRef<HTMLDivElement | null>(null);

  const isHovered = useHover(eventBlockRef);

  const { clickEvent, activeEventId, setActiveEventId } = useTimelineContext();

  const {
    handleDrag,
    id,
    eventOrigin,
    title,
    timeStart,
    timeEnd,
    sliderLeftRef,
    sliderRightRef,
    handleSlider,
    handleClickToDeleteEvent,
    isModalOpen,
  } = props;

  const eventObj = {
    id,
    title,
    timeStart,
    timeEnd,
  };

  return (
    <>
      <div
        ref={eventBlockRef}
        onMouseDown={(e) => handleDrag(e, id)}
        className={classNames({
          'event-block': true,
          active: activeEventId === id,
        })}
        data-event-id={`event-${id}`}
        style={{ zIndex: 2, ...transformObjToCss(eventOrigin) }}
        onKeyDown={(e) => handleClickToDeleteEvent(e, id)}
        tabIndex={0}
        onClick={() => {
          clickEvent(eventObj);
          setActiveEventId(id);
        }}
        onBlur={() => {
          if (!isModalOpen) {
            setActiveEventId(null);
          }
        }}
      >
        <p className="event-name">{title}</p>
        <p className="event-time">
          {timeStart} - {timeEnd}
        </p>
        <>
          {isHovered ? (
            <>
              <div
                onMouseDown={(e) => handleSlider(e, id)}
                ref={sliderLeftRef}
                className="slider-left"
                data-name="sliderLeft"
              />
              <div
                ref={sliderRightRef}
                onMouseDown={(e) => handleSlider(e, id)}
                className="slider-right"
                data-name="sliderRight"
              />
            </>
          ) : null}
        </>
      </div>
    </>
  );
});

// const EventBlockShadow = (props: any) => {
//   const { id, eventOrigin, title, timeStart, timeEnd } = props;

//   const [start, setStart] = useState(timeStart);
//   const [end, setEnd] = useState(timeEnd);
//   const [w, setW] = useState(eventOrigin.w);
//   const [left, setLeft] = useState(eventOrigin.left);
//   const [right, setRight] = useState(eventOrigin.right);

//   useEffect(() => {
//     setStart(timeStart);
//     setEnd(timeEnd);
//     setW(w);
//     right && setRight(right);
//     left && setLeft(left);
//   }, []);

//   return (
//     <div
//       className="event-block"
//       data-event-id={`event-${id}`}
//       style={{
//         zIndex: 2,
//         ...transformObj({ ...eventOrigin, w, bgColor: 'rgba(0,0,0, .1)' }),
//       }}
//     >
//       <p className="event-name">{title}</p>
//       <p className="event-time">
//         {start} - {end}
//       </p>
//     </div>
//   );
// };

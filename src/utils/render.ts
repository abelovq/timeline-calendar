import { IResource, ITimeEvent, ITimeEventWithCoords } from '../interfaces';
import { getCoordsByTime } from './coords';
import { isDateInCurreWeek } from './dates';

export interface ITransformToMap<T> {
  [id: string]: T;
}

export type ITimeEventWithCoordsMap = ITransformToMap<ITimeEventWithCoords>;

export const mapDefaultEventToEventOrigin = (
  data: ITransformToMap<ITimeEvent> | ITimeEventWithCoordsMap,
  resources: IResource[],
  weekStartDate: Date
): ITimeEventWithCoordsMap => {
  const res = {} as ITimeEventWithCoordsMap;

  for (const id in data) {
    const { start, end } = data[id];

    const bgColor =
      resources.find(({ id: resourceId }) => resourceId === data[id].resource)
        ?.color ?? '#eeeeee';

    let startDateStr,
      endDateStr,
      startTimeStr,
      endTimeStr,
      startYear,
      startMonth,
      startDate,
      endYear,
      endMonth,
      endDate,
      startH,
      startM,
      endH,
      endM;

    startDateStr = start.split('T')[0];
    startTimeStr = start.split('T')[1];

    endDateStr = end.split('T')[0];
    endTimeStr = end.split('T')[1];

    [startYear, startMonth, startDate] = startDateStr.match(/(\d+)+/gi)!;
    [startH, startM] = startTimeStr.match(/(\d+)+/gi)!;

    [endYear, endMonth, endDate] = endDateStr.match(/(\d+)+/gi)!;
    [endH, endM] = endTimeStr.match(/(\d+)+/gi)!;

    const o = {
      startYear,
      startMonth,
      startDate,
      startH,
      startM,
      endYear,
      endMonth,
      endDate,
      endH,
      endM,
    };

    const eventOrigin = getCoordsByTime(o, weekStartDate);

    eventOrigin.eventOrigin.bgColor = bgColor;

    res[id] = { ...data[id], hasEdit: false, ...eventOrigin };
  }
  return res;
};

export const filterNewEvents = (
  events: ITimeEvent[],
  eventsMap: ITimeEventWithCoordsMap
): ITimeEvent[] => {
  return events.filter((ev) => {
    let isFiltered = true;
    for (const eventId in eventsMap) {
      if (
        eventsMap[eventId].hasEdit ||
        (eventsMap[eventId].start === ev.start &&
          eventsMap[eventId].end === ev.end)
      ) {
        return false;
      }
    }
    return isFiltered;
  });
};

interface IFilterData {
  dataEvents: ITimeEventWithCoordsMap;
  mode: 'week' | 'day';
  weekStartDate: Date;
}

export const filterData = ({
  dataEvents,
  weekStartDate,
  mode,
}: IFilterData): ITimeEventWithCoordsMap => {
  // TODO filter for week or other mode e.g. day
  const predicat = (item: ITimeEvent) => {
    const { start, end } = item;

    if (!start || !end) return true;

    let startDateStr,
      endDateStr,
      startTimeStr,
      endTimeStr,
      startYear,
      startMonth,
      startDate,
      endYear,
      endMonth,
      endDate,
      startH,
      startM,
      endH,
      endM;

    startDateStr = start.split('T')[0];
    startTimeStr = start.split('T')[1];
    endDateStr = end.split('T')[0];
    endTimeStr = end.split('T')[1];

    [startYear, startMonth, startDate] = startDateStr.match(/(\d+)+/gi)!;
    [endYear, endMonth, endDate] = endDateStr.match(/(\d+)+/gi)!;

    [startH, startM] = startTimeStr.match(/(\d+)+/gi)!;
    [endH, endM] = endTimeStr.match(/(\d+)+/gi)!;

    const eventDate = new Date(
      +startYear,
      +startMonth - 1,
      +startDate,
      +startH,
      +startM
    );

    const condByDate = isDateInCurreWeek(eventDate, weekStartDate);

    return condByDate;
  };

  const res = {} as ITimeEventWithCoordsMap;

  for (const id in dataEvents) {
    if (predicat(dataEvents[id])) {
      res[id] = dataEvents[id];
    }
  }

  return res;
};

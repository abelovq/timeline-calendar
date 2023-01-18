import { minusWeek, parsedDate, plusWeek } from './dates';

export const getIntervals = ({ format = '24' }: { format: '24' | '12' }) => {
  let intervals: string[] = [];
  switch (format) {
    case '12': {
      intervals = ['12:00 AM'];
      let i = 1,
        k = 1;
      while (i <= 23) {
        if (i >= 12) {
          if (intervals.includes('12:00 PM')) {
            intervals.push(`${k}:00 PM`);
            k++;
          } else {
            intervals.push(`${12}:00 PM`);
          }
        } else {
          intervals.push(`${i}:00 AM`);
        }
        i++;
      }
      break;
    }
    case '24': {
      for (let i = 1; i < 24; i++) {
        intervals.push(`${i}`.padStart(2, '0') + ':00');
      }
      break;
    }
  }
  return intervals;
};

export const intervals = getIntervals({ format: '12' });

export const cacheWrapper = (fn: (arg: number) => Map<number, number>) => {
  const cache = new Map();

  return (coeff: number) => {
    if (cache.has(coeff)) {
      return cache.get(coeff);
    }

    const res = fn.call(null, coeff);

    cache.set(coeff, [...res.values()].flat());
    return cache.get(coeff);
  };
};

export const getTimeMap = (coeff: number) => {
  const res: number[] = [],
    chunked: number[][] = [];

  for (let i = 1344 * coeff; i <= 1344 + 1344 * coeff; i += 14) {
    res.push(i);
  }
  for (let i = 0; i <= res.length; i += 4) {
    const chunk = res.slice(i, i + 4);
    if (chunk.length) {
      chunked.push(chunk);
    }
  }
  // TODO think about map with 24h format
  return intervals.reduce(
    (acc, curr, i) => (acc.set(curr, chunked[i]), acc),
    new Map()
  );
};

export const getNearestNum = (arr: number[], v: number): number => {
  // TODO bug with disappearing at  ~ 1342
  let i = 0;
  for (; i < arr.length; i++) {
    if (v >= arr[0] && v < arr[0] + 14) {
      return arr[0];
    }

    if (arr[i] > v) {
      return arr[i - 1];
    }
    if (arr[i] === v) {
      return arr[i];
    }
  }
  if (v - arr[i - 1] > 14) {
    return arr[i - 1] + 14;
  }
  return arr[i - 1];
};

const format24Map = {
  '12:00 AM': '00:00',
  '1:00 AM': '01:00',
  '2:00 AM': '02:00',
  '3:00 AM': '03:00',
  '4:00 AM': '04:00',
  '5:00 AM': '05:00',
  '6:00 AM': '06:00',
  '7:00 AM': '07:00',
  '8:00 AM': '08:00',
  '9:00 AM': '09:00',
  '10:00 AM': '10:00',
  '11:00 AM': '11:00',
  '12:00 PM': '12:00',
  '1:00 PM': '13:00',
  '2:00 PM': '14:00',
  '3:00 PM': '15:00',
  '4:00 PM': '16:00',
  '5:00 PM': '17:00',
  '6:00 PM': '18:00',
  '7:00 PM': '19:00',
  '8:00 PM': '20:00',
  '9:00 PM': '21:00',
  '10:00 PM': '22:00',
  '11:00 PM': '23:00',
};

type format12h = string;
type format24h = string;
type dateString = string;

export const getTimeByCoords = (
  coord: number,
  coeff: number,
  weekStartDate: Date
): [dateString, format12h, format24h] => {
  const [y, m, d] = parsedDate(weekStartDate);

  const newWeekStartDate = d + coeff;

  const timeMap: any = getTimeMap(coeff);

  const date = new Date(y, m, newWeekStartDate);
  const dateValue = [date.getFullYear(), date.getMonth(), date.getDate()];

  const dateValueArr = dateValue
    .map((item, i) =>
      i === 1 ? `${item + 1}`.padStart(2, '0') : `${item}`.padStart(2, '0')
    )
    .join('-');

  type format24MapType = keyof typeof format24Map;

  let prev = '12:00 AM';
  for (const [k, v] of timeMap) {
    for (let i = 0; i < v.length; i++) {
      const mins = ['00', '15', '30', '45'];

      if (v[i] > coord && i === 0) {
        const time12format = `${prev.replace(/(\d+)(\W)(\d+)/, `$1$245`)}`;
        const time24format = `${format24Map[prev as format24MapType].replace(
          /(\d+)(\W)(\d+)/,
          `$1$245`
        )}`;

        return [`${dateValueArr}`, time12format, time24format];
      }
      if (v[i] > coord) {
        let j = i - 1;

        const time12format = `${k.replace(/(\d+)(\W)(\d+)/, `$1$2${mins[j]}`)}`;
        const time24format = `${format24Map[k as format24MapType].replace(
          /(\d+)(\W)(\d+)/,
          `$1$2${mins[j]}`
        )}`;

        return [`${dateValueArr}`, time12format, time24format];
      }
      if (v[i] === coord) {
        if (mins[i]) {
          const time12format = `${k.replace(
            /(\d+)(\W)(\d+)/,
            `$1$2${mins[i]}`
          )}`;
          const time24format = `${format24Map[k as format24MapType].replace(
            /(\d+)(\W)(\d+)/,
            `$1$2${mins[i]}`
          )}`;

          return [`${dateValueArr}`, time12format, time24format];
        }
      }
    }
    prev = k;
  }
  return [`${dateValueArr}`, '11:45 PM', '23:45'];
};

export const isDateInCurreWeek = (eventDate: Date, startDate: Date) => {
  const dateIn7days = plusWeek(startDate);
  return eventDate >= startDate && eventDate < dateIn7days;
};

function findWeekRangeOfDate(targetDate: Date, weekStartDate: Date) {
  if (targetDate > weekStartDate) {
    while (true) {
      if (isDateInCurreWeek(targetDate, weekStartDate)) {
        return parsedDate(targetDate)[2] - parsedDate(weekStartDate)[2];
      }
      weekStartDate = plusWeek(weekStartDate);
    }
  }
  if (targetDate < weekStartDate) {
    while (true) {
      if (isDateInCurreWeek(targetDate, weekStartDate)) {
        return parsedDate(targetDate)[2] - parsedDate(weekStartDate)[2];
      }

      weekStartDate = minusWeek(weekStartDate);
    }
  }
}

export const getCoordsByTime = (
  dateObj: { [prop: string]: string },
  weekStartDate: Date
) => {
  const [y, m, d] = parsedDate(weekStartDate);
  const { startYear, startMonth, startDate, startH, startM, endH, endM } =
    dateObj;
  const eventDate = new Date(
    +startYear,
    +startMonth - 1,
    +startDate,
    +startH,
    +startM
  );

  let diff;
  if (!isDateInCurreWeek(eventDate, weekStartDate)) {
    diff = findWeekRangeOfDate(eventDate, weekStartDate);
  } else {
    diff = Math.abs(+startDate - d);
  }

  const timeMap = getTimeMap(diff as number);

  let timeForStart = 'AM';
  let timeForEnd = 'AM';

  let parsedStartH = parseInt(startH, 10);
  const parsedStartMins = parseInt(startM, 10);

  let parsedEndH = parseInt(endH, 10);
  const parsedEndMins = parseInt(endM, 10);

  if (parsedStartH >= 12) {
    parsedStartH = parsedStartH % 12 || 12;
    timeForStart = 'PM';
  }

  if (parsedEndH >= 12) {
    parsedEndH = parsedEndH % 12 || 12;
    timeForEnd = 'PM';
  }

  const startHourPosXArr = timeMap.get(`${parsedStartH}:00 ${timeForStart}`);
  const endHourPosXArr = timeMap.get(`${parsedEndH}:00 ${timeForEnd}`);

  let startPosX = startHourPosXArr[0];
  let endPosX = endHourPosXArr[0];

  if (parsedStartMins === 15) startPosX = startHourPosXArr[1];
  if (parsedStartMins === 30) startPosX = startHourPosXArr[2];
  if (parsedStartMins === 45) startPosX = startHourPosXArr[3];

  if (parsedEndMins === 15) endPosX = endHourPosXArr[1];
  if (parsedEndMins === 30) endPosX = endHourPosXArr[2];
  if (parsedEndMins === 45) endPosX = endHourPosXArr[3];

  const w = endPosX - startPosX;

  return {
    eventOrigin: { h: 50, posX: startPosX, posY: 12, w, bgColor: '' },
    timeStart: `${parsedStartH}:${startM} ${timeForStart}`,
    timeEnd: `${parsedEndH}:${endM} ${timeForEnd}`,
  };
};

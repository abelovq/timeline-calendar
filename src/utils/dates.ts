import { range } from './misc';

export const minusWeek = (date: Date) => {
  const today = new Date(date);
  today.setDate(today.getDate() - 7);
  return today;
};

export const plusWeek = (date: Date) => {
  const today = new Date(date);
  today.setDate(today.getDate() + 7);
  return today;
};

export const getCurrentWeekDays = (date: Date) => {
  const currDate = new Date(date).getDate();
  const currYear = new Date(date).getFullYear();
  const currMonth = new Date(date).getMonth();

  return range(currDate, currDate + 7, (i) => {
    const [weekDay, number, month, year] = new Date(currYear, currMonth, i)
      .toLocaleDateString('en-GB', {
        day: 'numeric',
        weekday: 'short',
        year: 'numeric',
        month: 'short',
      })
      .split(' ');
    return `${number} ${weekDay} ${month} ${year}`.replace(/,/g, '');
  });
};

export const isDateInCurreWeek = (eventDate: Date, startDate: Date) => {
  const dateIn7days = plusWeek(startDate);
  return eventDate >= startDate && eventDate < dateIn7days;
};

export const parsedDate = (date: Date): number[] => [
  date.getFullYear(),
  date.getMonth(),
  date.getDate(),
];

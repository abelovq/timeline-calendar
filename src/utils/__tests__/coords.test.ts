import { isDateInCurreWeek } from '../coords';

describe('coords tests', () => {
  it('should correct work', () => {
    const eventDate1 = new Date(2023, 1, 16);
    const eventDate2 = new Date(2022, 2, 19);
    const eventDate3 = new Date(2023, 2, 16);

    const startDate = new Date();
    startDate.setHours(0);
    startDate.setMinutes(0);
    startDate.setSeconds(0);
    startDate.setMilliseconds(0);

    expect(isDateInCurreWeek(eventDate1, startDate)).toBe(false);
    expect(isDateInCurreWeek(eventDate2, startDate)).toBe(false);
    expect(isDateInCurreWeek(eventDate3, startDate)).toBe(false);

    for (let i = 18; i < 25; i++) {
      console.log(i);
      expect(isDateInCurreWeek(new Date(2023, 0, i), startDate)).toBe(true);
    }
  });
});

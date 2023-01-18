import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/extend-expect';

import { TimelineCalendar } from '../TimelineCalendar';
import { parsedDate } from '../utils/dates';

const [y, m, d] = parsedDate(new Date());

const myEvents = [
  {
    title: 'Fixed event',
    start: `${y}-${m + 1}-${d}T16:00`,
    end: `${y}-${m + 1}-${d}T18:30`,
    color: '#9e9e9e',
    editable: false,
    resource: 1,
  },
  {
    title: 'Fixed event 2',
    start: `${y}-${m + 1}-${d - 5}T16:00`,
    end: `${y}-${m + 1}-${d - 5}T19:30`,
    color: '#9e9e9e',
    editable: false,
    resource: 4,
  },
];

const myResources = [
  {
    id: 1,
    name: 'Resource A',
    color: '#fdf500',
  },
  {
    id: 2,
    name: 'Resource B',
    color: '#ff0101',
  },
  {
    id: 3,
    name: 'Resource C',
    color: '#01adff',
  },
  {
    id: 4,
    name: 'Resource D',
    color: '#239a21',
  },
  {
    id: 5,
    name: 'Resource E',
    color: '#ff4600',
  },
];

describe('TimelineComp', () => {
  it('should work', () => {
    expect(TimelineCalendar).toBeDefined();
  });
  it('should render events for current week', () => {
    render(
      <TimelineCalendar defaultEvents={myEvents} resources={myResources} />
    );

    const events = screen.getAllByText(/fixed event/i);
    expect(events.length).toBe(1);

    expect(screen.getByText('4:00 PM - 6:30 PM')).toBeInTheDocument();
    expect(screen.queryByText('4:00 PM - 6:00 PM')).not.toBeInTheDocument();
  });

  it('should change current week and show event for previous week', async () => {
    const user = userEvent.setup();
    const today = new Date();
    const weekAgoDate = today.getDate() - 7;

    const weekAgo = new Date(today.setDate(weekAgoDate));
    const [w, d] = weekAgo
      .toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })
      .split(' ');

    render(
      <TimelineCalendar defaultEvents={myEvents} resources={myResources} />
    );

    const button = screen.getByRole('button', { name: 'PREV WEEK' });
    await user.click(button);

    const event = screen.getByText('Fixed event 2');
    const time = screen.getByText(`${d} ${w}`);

    expect(event).toBeInTheDocument();
    expect(time).toBeInTheDocument();
  });

  it('should change current week and show event for next week', async () => {
    const user = userEvent.setup();
    const today = new Date();
    const weekNextDate = today.getDate() + 7;

    const weekAgo = new Date(today.setDate(weekNextDate));
    const [w, d] = weekAgo
      .toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })
      .split(' ');

    render(
      <TimelineCalendar defaultEvents={myEvents} resources={myResources} />
    );

    const button = screen.getByRole('button', { name: 'NEXT WEEK' });
    await user.click(button);

    const event = screen.queryAllByText(/event/i);
    const time = screen.getByText(`${d} ${w}`);

    expect(event.length).toBe(0);
    expect(time).toBeInTheDocument();
  });
});

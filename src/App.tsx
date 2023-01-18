import { useCallback, useState } from 'react';

import { TimelineCalendar } from './TimelineCalendar';

import './App.css';

const myEvents = [
  {
    title: 'Fixed event',
    start: '2023-01-19T16:00',
    end: '2023-01-19T18:30',
    color: '#9e9e9e',
    editable: false,
    resource: 1,
  },
  {
    title: 'Fixed event 2',
    start: '2023-01-13T16:30',
    end: '2023-01-13T19:45',
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

function App() {
  const [events, setEvents] = useState(myEvents);

  const add = () => {
    setEvents((ev) => [
      ...ev,
      {
        title: 'Fixed event 3',
        start: '2023-01-20T08:00',
        end: '2023-01-20T12:00',
        color: '#9e9e9e',
        editable: false,
        resource: 4,
      },
    ]);
  };

  const onDeleteEvent = useCallback(
    (event: any) => console.log('delete event', event),
    []
  );

  const onEventClick = useCallback(
    (event: any) => console.log('click event', event),
    []
  );

  const onAddEvent = useCallback(
    (event: any) => console.log('add event', event),
    []
  );

  return (
    <main className="main">
      <button onClick={add}>ADD EVENT</button>
      <TimelineCalendar
        className="timeline-calendar"
        onAddEvent={onAddEvent}
        onDeleteEvent={onDeleteEvent}
        onEventClick={onEventClick}
        defaultEvents={events}
        resources={myResources}
      />
    </main>
  );
}

export default App;

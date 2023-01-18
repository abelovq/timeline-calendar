import { createContext, useContext } from 'react';

const TimelineCompContext = createContext<any | null>(null);

interface ITimelineCompProvider {
  setEvent: (event: any) => void;
  setDeleteEvent: (id: number) => void;
  clickEvent: (data: any) => void;
  activeEventId: number | null;
  setActiveEventId: (value: number | null) => void;
}

export const TimelineCompProvider: React.FC<
  React.PropsWithChildren<{ value: ITimelineCompProvider }>
> = ({ children, value }) => {
  return (
    <TimelineCompContext.Provider value={value}>
      {children}
    </TimelineCompContext.Provider>
  );
};

export const useTimelineContext = () => {
  const context: ITimelineCompProvider = useContext(TimelineCompContext);
  return context;
};

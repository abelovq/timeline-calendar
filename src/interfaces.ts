export interface ITimeEvent {
  title: string;
  start: string;
  end: string;
  color: string;
  editable?: boolean;
  resource: number;
}

export interface IResource {
  id: number;
  name: string;
  color: string;
}

export interface ITimeEventCoords {
  h: number;
  posX?: number;
  posXRight?: number;
  posY: number;
  w: number;
  bgColor: string;
}

export interface ITimeEventWithCoords extends ITimeEvent {
  eventOrigin: ITimeEventCoords;
  timeStart: string;
  timeEnd: string;
  hasEdit: boolean;
}

export type MakeOptional<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

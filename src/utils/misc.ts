import { ITransformToMap } from './render';

export const getMaxKey = (obj: object) => {
  const keys = Object.keys(obj);
  if (keys.length > 0) {
    return Math.max(...Object.keys(obj).map(Number)) + 1;
  }
  return 1;
};

export const transformToMap = <T extends {}>(
  data: T[],
  id: number
): ITransformToMap<T> => {
  return data.reduce(
    (acc, curr) => ((acc[id++] = curr), acc),
    {} as ITransformToMap<T>
  );
};

export const range = <T>(
  from: number,
  to: number,
  cb?: (arg: number) => T
): (T | number)[] => {
  const res = [];
  for (let i = from; i < to; i++) {
    if (cb) {
      let value = cb(i) as T;
      res.push(value);
    } else {
      res.push(i);
    }
  }
  return res;
};

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

import { MakeOptional } from '../interfaces';

interface ITransformObjToCss {
  posX?: number;
  posXRight?: number;
  posY: number;
  w: number;
  h: number;
  bgColor: string;
}

export const transformObjToCss = (obj: ITransformObjToCss) => {
  interface Result {
    top: number;
    left: number;
    right: number | undefined;
    width: number;
    height: number;
    position: 'absolute';
    backgroundColor: string;
    cursor: string;
    '--hover-bg-color': string;
  }

  type ResultOptional = MakeOptional<Result, 'left'>;

  const res: ResultOptional = {
    // transform: `translate(${obj.posX}px, ${}px)`,
    top: obj.posY,
    left: obj.posX,
    right: obj.posXRight,
    width: obj.w,
    height: obj.h,
    position: 'absolute' as const,
    backgroundColor: obj.bgColor,
    cursor: 'pointer',
    '--hover-bg-color': obj.bgColor,
  };

  if ('posXRight' in obj) {
    delete res.left;
    return res;
  }
  return res;
};

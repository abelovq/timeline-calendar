import { memo } from 'react';
import { IResource } from '../interfaces';

import './styles.scss';

interface IResourcesProps {
  data: IResource[];
}

export const Resources = memo(function Resources({ data }: IResourcesProps) {
  return (
    <div className="resources">
      {data.map((el) => (
        <div key={el.id} className="resource">
          {el.name}
        </div>
      ))}
    </div>
  );
});

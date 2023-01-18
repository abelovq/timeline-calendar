import { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { CSSTransition } from 'react-transition-group';

import './styles.scss';
import './animation.scss';
import { Portal } from '../Portal';

interface ILayoutProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ANIMATION_TIME = 300;

export const Layout = ({
  onClose,
  children,
  isOpen,
}: ILayoutProps & PropsWithChildren) => {
  // const contentRef = useRef<HTMLDivElement | null>(null);

  return (
    <Portal>
      <div className="content-block" onClick={onClose}>
        {children}
      </div>
    </Portal>
  );
};

import { PropsWithChildren } from 'react';
import { CSSTransition } from 'react-transition-group';

import { ANIMATION_TIME, Layout } from './Layout';

interface IModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Modal = ({
  isOpen,
  onClose,
  children,
}: IModalProps & PropsWithChildren) => {
  return (
    <>
      <CSSTransition
        in={isOpen}
        timeout={ANIMATION_TIME}
        mountOnEnter
        unmountOnExit
        classNames="content"
      >
        <Layout onClose={onClose} isOpen={isOpen}>
          {children}
        </Layout>
      </CSSTransition>
    </>
  );
};

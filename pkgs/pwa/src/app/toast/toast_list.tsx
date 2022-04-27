import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';

import { ZIndex } from '../../constants/style';
import { eventemitter, EVENT_TYPE } from '../../platform/toast';
import getRandomString from '../../utils/get_random_string';
import { Toast as ToastType, TOAST_ANIMATION_DURATION } from './constants';
import Toast from './toast';

const TOAST_SPACE = 20;

const Style = styled.div`
  z-index: ${ZIndex.TOAST};
  position: fixed;
  top: 70px;
  right: 20px;
  width: 300px;
`;

const ToastList = () => {
  const [toastList, setToastList] = useState<ToastType[]>([]);
  const removeToast = useCallback((id) => {
    setTimeout(
      () => setToastList((tl) => tl.filter((t) => t.id !== id)),
      TOAST_ANIMATION_DURATION * 2,
    );
    setToastList((tl) =>
      tl
        .map((toast) => {
          if (toast.id === id) {
            clearTimeout(toast.timer);
            return {
              ...toast,
              hidden: true,
              timer: null,
            };
          }
          return toast;
        })
        .map((toast, index, newToastList) => {
          if (toast.hidden) {
            return toast;
          }
          let top = 0;
          for (let i = 0; i < index; i += 1) {
            const t = newToastList[i];
            if (!t.hidden) {
              top += t.height + TOAST_SPACE;
            }
          }
          return {
            ...toast,
            top,
          };
        }),
    );
  }, []);
  const updateToastHeight = useCallback(
    (id, height) =>
      setToastList((tl) =>
        tl.map((t) => {
          if (t.id === id) {
            return {
              ...t,
              height,
            };
          }
          return t;
        }),
      ),
    [],
  );

  useEffect(() => {
    const toastListener = ({ message, type, duration }) =>
      setTimeout(() => {
        const id = getRandomString();
        const timer = duration
          ? setTimeout(() => removeToast(id), duration)
          : null;
        setToastList((tl) => {
          const top = tl.reduce(
            (total, t) => total + (t.hidden ? 0 : t.height + TOAST_SPACE),
            0,
          );
          return [
            ...tl,
            {
              id,
              timer,
              message,
              type,
              duration,
              top,
              height: 0,
              hidden: false,
            } as ToastType,
          ];
        });
      }, 1);
    eventemitter.on(EVENT_TYPE, toastListener);
    return () => void eventemitter.off(EVENT_TYPE, toastListener);
  }, [removeToast]);

  return (
    <Style>
      {toastList.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          updateToastHeight={updateToastHeight}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </Style>
  );
};

export default React.memo(ToastList);

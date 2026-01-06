import { Position } from '@/constants';
import storage, { Key } from '@/storage';
import logger from '@/utils/logger';
import {
  useCallback,
  useEffect,
  useState,
  PointerEventHandler,
  useRef,
} from 'react';
import { SIZE } from './constants';

const DEFAULT_POSITION: Position = {
  x: 0,
  y: 50,
};

function usePosition() {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position | null>(null);

  useEffect(
    () =>
      void storage
        .getItem(Key.DOWNLOAD_FLOATING_POSITION)
        .then((p) => setPosition(p || DEFAULT_POSITION))
        .catch((error) => {
          logger.error(
            error,
            'Failed to get download-floating position from storage',
          );
          setPosition(DEFAULT_POSITION);
        }),
    [],
  );

  const [pointerDown, setPointerDown] = useState(false);
  const lastPointRef = useRef<Position>({ x: 0, y: 0 });
  const onPointerDown = useCallback<PointerEventHandler<HTMLDivElement>>(
    (event) => {
      ref.current?.setPointerCapture(event.pointerId);
      setPointerDown(true);

      lastPointRef.current = {
        x: event.clientX,
        y: event.clientY,
      };
    },
    [],
  );
  const onPointerUp = useCallback<PointerEventHandler<HTMLDivElement>>(
    (event) => {
      ref.current?.releasePointerCapture(event.pointerId);
      setPointerDown(false);
    },
    [],
  );
  const onPointerMove = useCallback<PointerEventHandler<HTMLDivElement>>(
    (event) => {
      if (pointerDown) {
        const x = event.clientX;
        const y = event.clientY;

        const lastPoint = lastPointRef.current;
        setPosition((p) =>
          p
            ? {
                x: p.x + (x - lastPoint.x),
                y: p.y + (y - lastPoint.y),
              }
            : null,
        );

        lastPointRef.current = { x, y };
      }
    },
    [pointerDown],
  );

  useEffect(
    () =>
      pointerDown
        ? undefined
        : setPosition((p) => {
            if (p) {
              let x = p.x;
              let y = p.y;
              const offsetX = x + SIZE;
              const offsetY = y + SIZE;
              const { innerWidth: windowWidth, innerHeight: windowHeight } =
                window;
              if (
                x < 0 ||
                y < 0 ||
                offsetX > windowWidth ||
                offsetY > windowHeight
              ) {
                if (x < 0) {
                  x = 0;
                }
                if (y < 0) {
                  y = 0;
                }
                if (offsetX > windowWidth) {
                  x = windowWidth - SIZE;
                }
                if (offsetY > windowHeight) {
                  y = windowHeight - SIZE;
                }
                return { x, y };
              }
            }
            return p;
          }),
    [pointerDown],
  );

  useEffect(() => {
    if (!pointerDown) {
      const onResize = () => {
        const { innerWidth, innerHeight } = window;
        setPosition((p) => {
          if (p) {
            let x = p.x;
            let y = p.y;
            const offsetX = x + SIZE;
            const offsetY = y + SIZE;
            if (offsetX > innerWidth || offsetY > innerHeight) {
              if (offsetX > innerWidth) {
                x = innerWidth - SIZE;
              }
              if (offsetY > innerHeight) {
                y = innerHeight - SIZE;
              }
              return { x, y };
            }
          }
          return p;
        });
      };
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }
  }, [pointerDown]);

  useEffect(
    () =>
      pointerDown || !position
        ? undefined
        : void storage.setItem(Key.DOWNLOAD_FLOATING_POSITION, position),
    [pointerDown, position],
  );

  return { position, ref, onPointerDown, onPointerUp, onPointerMove };
}

export default usePosition;

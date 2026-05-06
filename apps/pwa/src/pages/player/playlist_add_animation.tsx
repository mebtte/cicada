import { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { PiMusicNotesSimpleLight } from 'react-icons/pi';
import { CSS_VAR } from '@/components/theme';
import eventemitter, { EventType } from './eventemitter';
import { ZIndex } from './constants';

const NOTE_SIZE = 34;
const MAX_NOTE_COUNT = 10;
const ANIMATION_DURATION = 980;

interface Point {
  x: number;
  y: number;
}

interface AnimationItem {
  id: number;
  origin: Point;
  side: number;
  durationSecond: number;
  gravity: number;
  riseVelocity: number;
}

const Layer = styled.div`
  z-index: ${ZIndex.FLOATING};

  position: fixed;
  inset: 0;

  pointer-events: none;
`;

const Note = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: ${NOTE_SIZE}px;
  height: ${NOTE_SIZE}px;

  display: flex;
  align-items: center;
  justify-content: center;

  color: var(${CSS_VAR.colorPrimary});
  filter: drop-shadow(0 3px 0 var(${CSS_VAR.colorPrimaryShadow}));

  opacity: 0;
  transform: translate3d(0, 0, 0) scale(0.42);
  will-change: transform, opacity;

  > svg {
    width: 100%;
    height: 100%;
  }
`;

function getScale(progress: number) {
  if (progress < 0.08) {
    return 0.65 + (1.08 - 0.65) * (progress / 0.08);
  }
  if (progress < 0.34) {
    return 1.08 + (1 - 1.08) * ((progress - 0.08) / 0.26);
  }
  if (progress < 0.82) {
    return 1 + (0.82 - 1) * ((progress - 0.34) / 0.48);
  }
  return 0.82 + (0.55 - 0.82) * ((progress - 0.82) / 0.18);
}

function getOpacity(progress: number) {
  if (progress < 0.08) {
    return progress / 0.08;
  }
  if (progress < 0.82) {
    return 1;
  }
  return Math.max(0, 1 - (progress - 0.82) / 0.18);
}

function createAnimationItem(id: number, source: Point) {
  const direction = Math.random() > 0.5 ? 1 : -1;
  const side = direction * (150 + Math.random() * 40);
  const fall = 420 + Math.random() * 80;
  const apex = 82 + Math.random() * 24;
  const durationSecond = ANIMATION_DURATION / 1000;
  const apexTime =
    durationSecond / (1 + Math.sqrt(1 + fall / apex));
  const gravity = (2 * apex) / apexTime ** 2;
  return {
    id,
    origin: {
      x: source.x - NOTE_SIZE / 2,
      y: source.y - NOTE_SIZE / 2,
    },
    side,
    durationSecond,
    gravity,
    riseVelocity: gravity * apexTime,
  };
}

function AnimatedNote({
  item,
  onDone,
}: {
  item: AnimationItem;
  onDone: (id: number) => void;
}) {
  const noteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame: number;
    const startTimestamp = performance.now();

    const update = (timestamp: number) => {
      const progress = Math.min(
        (timestamp - startTimestamp) / ANIMATION_DURATION,
        1,
      );
      const elapsedSecond = item.durationSecond * progress;
      const x = item.origin.x + item.side * progress;
      const y =
        item.origin.y -
        item.riseVelocity * elapsedSecond +
        0.5 * item.gravity * elapsedSecond ** 2;
      const note = noteRef.current;
      if (note) {
        note.style.opacity = getOpacity(progress).toString();
        note.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${getScale(
          progress,
        )})`;
      }

      if (progress < 1) {
        frame = window.requestAnimationFrame(update);
      } else {
        onDone(item.id);
      }
    };

    frame = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(frame);
  }, [item, onDone]);

  return (
    <Note ref={noteRef}>
      <PiMusicNotesSimpleLight />
    </Note>
  );
}

function PlaylistAddAnimation() {
  const [items, setItems] = useState<AnimationItem[]>([]);
  const removeItem = useCallback(
    (id: number) => setItems((list) => list.filter((item) => item.id !== id)),
    [],
  );

  useEffect(() => {
    let nextId = 0;
    return eventemitter.listen(
      EventType.ACTION_ADD_MUSIC_LIST_TO_PLAYLIST,
      ({ animationSource }) => {
        if (!animationSource) {
          return;
        }
        const item = createAnimationItem(nextId, animationSource);
        nextId += 1;
        setItems((list) => [...list, item].slice(-MAX_NOTE_COUNT));
      },
    );
  }, []);

  if (!items.length) {
    return null;
  }
  return (
    <Layer>
      {items.map((item) => (
        <AnimatedNote key={item.id} item={item} onDone={removeItem} />
      ))}
    </Layer>
  );
}

export default PlaylistAddAnimation;

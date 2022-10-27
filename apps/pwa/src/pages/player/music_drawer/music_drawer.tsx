import { useTransition, animated } from 'react-spring';
import styled from 'styled-components';
import ErrorCard from '@/components/error_card';
import Drawer from '#/components/drawer';
import { CSSProperties } from 'react';
import absoluteFullSize from '#/style/absolute_full_size';
import { flexCenter } from '#/style/flexbox';
import Spinner from '#/components/spinner';
import eventemitter, { EventType } from '../eventemitter';
import useMusic from './use_music';
import { MusicDetail } from './constants';

const bodyProps: { style: CSSProperties } = {
  style: {
    width: '100%',
    maxWidth: 350,
  },
};
const Container = styled(animated.div)`
  ${absoluteFullSize}
`;
const StatusBox = styled(Container)`
  ${flexCenter}
`;
const DetailBox = styled(Container)``;

function Detail({ style, music }: { style: unknown; music: MusicDetail }) {
  // @ts-expect-error
  return <DetailBox style={style}>music</DetailBox>;
}

function MusicDrawer({
  zIndex,
  id,
  open,
  onClose,
}: {
  zIndex: number;
  id: string;
  open: boolean;
  onClose: () => void;
}) {
  const { data, reload } = useMusic(id);
  const transitions = useTransition(data, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });
  return (
    <Drawer
      open={open}
      onClose={onClose}
      maskProps={{ style: { zIndex } }}
      bodyProps={bodyProps}
    >
      {transitions((style, d) => {
        if (d.error) {
          return (
            <StatusBox style={style}>
              <ErrorCard errorMessage={d.error.message} retry={reload} />
            </StatusBox>
          );
        }

        if (d.loading) {
          return (
            <StatusBox style={style}>
              <Spinner />
            </StatusBox>
          );
        }

        return <Detail style={style} music={d.music!} />;
      })}
    </Drawer>
  );
}

export default MusicDrawer;

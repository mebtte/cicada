import { animated, useTransition } from 'react-spring';
import styled from 'styled-components';
import { flexCenter } from '@/style/flexbox';
import ErrorCard from '@/components/error_card';
import Spinner from '@/components/spinner';
import absoluteFullSize from '@/style/absolute_full_size';
import autoScrollbar from '@/style/auto_scrollbar';
import { Drawer, DrawerContent } from '@/components';
import useData from './use_data';
import { Musicbill as MusicbillType } from './constants';
import Info from './info';
import MusicList from './music_list';
import Toolbar from './toolbar';

const Container = styled(animated.div)`
  ${absoluteFullSize}
`;
const StatusContainer = styled(Container)`
  ${flexCenter}
`;
const Style = styled.div`
  ${absoluteFullSize}
  ${autoScrollbar}
  overflow: auto;
`;

function Musicbill({
  musicbill,
  collected,
}: {
  musicbill: MusicbillType;
  collected: boolean;
}) {
  return (
    <Style>
      <Info musicbill={musicbill} />
      <MusicList musicList={musicbill.musicList} />
      <Toolbar musicbill={musicbill} collected={collected} />
    </Style>
  );
}

function Wrapper({
  open,
  onClose,
  id,
  zIndex,
}: {
  open: boolean;
  onClose: () => void;
  id: string;
  zIndex: number;
}) {
  const { data, reload, collected } = useData(id);

  const transitions = useTransition(data, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });
  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent side="right" style={{ width: 'min(85%, 400px)' }} showClose={false} zIndex={zIndex}>
        {transitions((style, d) => {
          const { error, loading, musicbill } = d;
          if (error) {
            return (
              <StatusContainer style={style}>
                <ErrorCard errorMessage={error.message} retry={reload} />
              </StatusContainer>
            );
          }
          if (loading) {
            return (
              <StatusContainer style={style}>
                <Spinner />
              </StatusContainer>
            );
          }
          return (
            <Container style={style}>
              <Musicbill musicbill={musicbill!} collected={collected} />
            </Container>
          );
        })}
      </DrawerContent>
    </Drawer>
  );
}

export default Wrapper;

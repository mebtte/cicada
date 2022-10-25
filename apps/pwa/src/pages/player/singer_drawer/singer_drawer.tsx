import styled from 'styled-components';
import Drawer from '#/components/drawer';
import { CSSProperties } from 'react';
import { animated, useTransition } from 'react-spring';
import absoluteFullSize from '#/style/absolute_full_size';
import { flexCenter } from '#/style/flexbox';
import ErrorCard from '@/components/error_card';
import Spinner from '#/components/spinner';
import useData from './use_data';
import { Singer } from './constants';

const bodyProps: { style: CSSProperties } = {
  style: {
    width: '90%',
    maxWidth: 450,
  },
};
const Container = styled(animated.div)`
  ${absoluteFullSize}
`;
const CardContainer = styled(Container)`
  ${flexCenter}
`;
const DetailContainer = styled(Container)`
  overflow: auto;
`;

function Detail({ style, singer }: { style: unknown; singer: Singer }) {
  // @ts-expect-error
  return <DetailContainer style={style}>singer</DetailContainer>;
}

function SingerDrawer({
  open,
  onClose,
  singerId,
}: {
  open: boolean;
  onClose: () => void;
  singerId: string;
}) {
  const { data, reload } = useData(singerId);

  const transitions = useTransition(data, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });
  return (
    <Drawer open={open} onClose={onClose} bodyProps={bodyProps}>
      {transitions((style, d) => {
        if (d.error) {
          return (
            <CardContainer style={style}>
              <ErrorCard errorMessage="xxx" retry={reload} />
            </CardContainer>
          );
        }
        if (d.loading) {
          return (
            <CardContainer style={style}>
              <Spinner />
            </CardContainer>
          );
        }
        return <Detail style={style} singer={d.singer!} />;
      })}
    </Drawer>
  );
}

export default SingerDrawer;

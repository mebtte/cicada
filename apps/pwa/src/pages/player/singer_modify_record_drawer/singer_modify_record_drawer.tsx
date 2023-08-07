import Drawer from '@/components/drawer';
import { CSSProperties } from 'react';
import styled from 'styled-components';
import autoScrollbar from '@/style/auto_scrollbar';
import { Singer } from './constants';
import useDynamicZIndex from '../use_dynamic_z_index';
import { EventType } from '../eventemitter';
import Content from './content';
import Hint from './hint';

const bodyProps: { style: CSSProperties } = {
  style: {
    width: 300,
  },
};
const ContentWrapper = styled.div`
  height: 100%;

  overflow: auto;
  ${autoScrollbar}
`;

function SingerModifyRecordDrawer({
  singer,
  open,
  onClose,
}: {
  singer: Singer;
  open: boolean;
  onClose: () => void;
}) {
  const zIndex = useDynamicZIndex(EventType.OPEN_SINGER_MODIFY_RECORD_DRAWER);
  return (
    <Drawer
      open={open}
      onClose={onClose}
      maskProps={{
        style: { zIndex },
      }}
      bodyProps={bodyProps}
    >
      <ContentWrapper>
        <Content singer={singer} />
        <Hint />
      </ContentWrapper>
    </Drawer>
  );
}

export default SingerModifyRecordDrawer;

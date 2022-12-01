import { CSSProperties, memo } from 'react';
import Drawer from '#/components/drawer';
import { EventType } from '../eventemitter';
import { Music as MusicType } from '../constants';
import useDynamicZIndex from '../use_dynamic_z_index';
import Top from './top';
import MusicbillList from './musicbill_list';

const bodyProps: { style: CSSProperties } = {
  style: {
    width: 300,
    overflow: 'auto',
  },
};

function MusicbillListDrawer({
  open,
  onClose,
  music,
}: {
  open: boolean;
  onClose: () => void;
  music: MusicType;
}) {
  const zIndex = useDynamicZIndex(EventType.OPEN_ADD_MUSIC_TO_MUSICBILL_DRAWER);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      maskProps={{ style: { zIndex } }}
      bodyProps={bodyProps}
    >
      <Top music={music} />
      <MusicbillList music={music} />
    </Drawer>
  );
}

export default memo(MusicbillListDrawer);

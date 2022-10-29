import Popup from '#/components/popup';
import { CSSProperties, MouseEventHandler, useEffect, useState } from 'react';
import MenuItem from '#/components/menu_item';
import { MdDelete, MdEdit } from 'react-icons/md';
import { CSSVariable } from '#/global_style';
import styled from 'styled-components';
import notice from '#/utils/notice';
import { MusicType } from '#/constants/music';
import { ZIndex } from '../constants';
import { MusicDetail } from './constants';
import e, { EventType } from './eventemitter';
import playerEventemitter, {
  EventType as PlayerEventType,
  EditDialogType,
} from '../eventemitter';

const Style = styled.div`
  padding: 5px 0;
`;
const maskProps: {
  style: CSSProperties;
  onClick: MouseEventHandler<HTMLDivElement>;
} = {
  style: { zIndex: ZIndex.POPUP },
  onClick: (event) => event.stopPropagation(),
};
const dangerousIconStyle: CSSProperties = {
  color: CSSVariable.COLOR_DANGEROUS,
};

function EditMenu({ music }: { music: MusicDetail }) {
  const [open, setOpen] = useState(true);
  const onClose = () => setOpen(false);

  useEffect(() => {
    const unlistenOpen = e.listen(EventType.OPEN_EDIT_MENU, () =>
      setOpen(true),
    );
    return unlistenOpen;
  }, []);

  return (
    <Popup open={open} onClose={onClose} maskProps={maskProps}>
      <Style onClick={onClose}>
        <MenuItem
          icon={<MdEdit />}
          label="编辑封面"
          onClick={() =>
            playerEventemitter.emit(PlayerEventType.OPEN_EDIT_DIALOG, {
              title: '编辑封面',
              type: EditDialogType.IMAGE,
            })
          }
        />
        {music.type === MusicType.SONG ? (
          <MenuItem
            icon={<MdEdit />}
            label="编辑歌词"
            onClick={() =>
              playerEventemitter.emit(PlayerEventType.OPEN_EDIT_DIALOG, {
                title: '编辑歌词',
                type: EditDialogType.TEXTAREA_LIST,
              })
            }
          />
        ) : null}
        <MenuItem
          icon={<MdDelete style={dangerousIconStyle} />}
          label="删除"
          onClick={() => notice.info('todo')}
        />
      </Style>
    </Popup>
  );
}

export default EditMenu;

import { MdHelpOutline } from 'react-icons/md';
import IconButton from '#/components/icon_button';
import { ComponentSize } from '#/constants/style';
import { memo } from 'react';
import dialog from '#/utils/dialog';
import useNavigate from '#/utils/use_navigate';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import { Query } from '@/constants';

function Guide() {
  const navigate = useNavigate();
  return (
    <IconButton
      size={ComponentSize.SMALL}
      onClick={() =>
        dialog.confirm({
          content: '找不到想要的音乐?',
          confirmText: '自己创建一首',
          onConfirm: () =>
            navigate({
              path: ROOT_PATH.PLAYER + PLAYER_PATH.MY_MUSIC,
              query: {
                [Query.CREATE_MUSIC_DIALOG_OPEN]: 1,
              },
            }),
        })
      }
    >
      <MdHelpOutline />
    </IconButton>
  );
}

export default memo(Guide);

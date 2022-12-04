import { memo } from 'react';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import { Query } from '@/constants';
import useNavigate from '@/utils/use_navigate';
import TextGuide from './text_guide';

function CreateMusicGuide() {
  const navigate = useNavigate();
  return (
    <TextGuide
      text1="找不到想要的音乐?"
      text2="自己创建一首"
      onGuide={() =>
        navigate({
          path: ROOT_PATH.PLAYER + PLAYER_PATH.MY_MUSIC,
          query: {
            [Query.CREATE_MUSIC_DIALOG_OPEN]: 1,
          },
        })
      }
    />
  );
}

export default memo(CreateMusicGuide);

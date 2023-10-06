import { memo } from 'react';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import { Query } from '@/constants';
import useNavigate from '@/utils/use_navigate';
import { t } from '@/i18n';
import TextGuide from './text_guide';

function CreateMusicGuide() {
  const navigate = useNavigate();
  return (
    <TextGuide
      text1={t('no_suitable_music_warning')}
      text2={t('create_music_by_yourself')}
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

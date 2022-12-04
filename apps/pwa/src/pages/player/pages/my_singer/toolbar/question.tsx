import { MdHelpOutline } from 'react-icons/md';
import IconButton from '@/components/icon_button';
import { NO_MUSIC_EXIST_DURATION } from '#/constants/singer';
import dialog from '@/utils/dialog';

function Question() {
  return (
    <IconButton
      onClick={() =>
        dialog.alert({
          content: `没有收录音乐的歌手会在 ${
            NO_MUSIC_EXIST_DURATION / 1000 / 60 / 60 / 24
          } 天内自动删除`,
        })
      }
    >
      <MdHelpOutline />
    </IconButton>
  );
}

export default Question;

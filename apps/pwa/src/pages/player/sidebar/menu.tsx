import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import {
  MdLooks,
  MdOutlineSettings,
  MdOutlineMusicNote,
  MdHistory,
} from 'react-icons/md';
import MenuItem from '@/components/menu_item';
import { useLocation, useNavigate } from 'react-router-dom';
import { CSSProperties } from 'react';
import { t } from '@/i18n';

const itemStyle: CSSProperties = { margin: '0 10px' };

function Menu() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <div>
      <MenuItem
        style={itemStyle}
        active={
          pathname === `${ROOT_PATH.PLAYER}${PLAYER_PATH.EXPLORATION}` ||
          pathname === ROOT_PATH.PLAYER
        }
        onClick={() =>
          navigate(`${ROOT_PATH.PLAYER}${PLAYER_PATH.EXPLORATION}`)
        }
        label={t('exploration')}
        icon={<MdLooks />}
      />
      <MenuItem
        style={itemStyle}
        active={pathname === `${ROOT_PATH.PLAYER}${PLAYER_PATH.MY_MUSIC}`}
        onClick={() => navigate(`${ROOT_PATH.PLAYER}${PLAYER_PATH.MY_MUSIC}`)}
        label={t('my_music')}
        icon={<MdOutlineMusicNote />}
      />
      <MenuItem
        style={itemStyle}
        active={
          pathname === `${ROOT_PATH.PLAYER}${PLAYER_PATH.MUSIC_PLAY_RECORD}`
        }
        onClick={() =>
          navigate(`${ROOT_PATH.PLAYER}${PLAYER_PATH.MUSIC_PLAY_RECORD}`)
        }
        label={t('music_play_record_short')}
        icon={<MdHistory />}
      />
      <MenuItem
        style={itemStyle}
        active={pathname === `${ROOT_PATH.PLAYER}${PLAYER_PATH.SETTING}`}
        onClick={() => navigate(`${ROOT_PATH.PLAYER}${PLAYER_PATH.SETTING}`)}
        label={t('setting')}
        icon={<MdOutlineSettings />}
      />
    </div>
  );
}

export default Menu;

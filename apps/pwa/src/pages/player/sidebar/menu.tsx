import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import {
  MdLooks,
  MdOutlineSettings,
  MdHistory,
  MdOutlineDownload,
  MdAdminPanelSettings,
} from 'react-icons/md';
import MenuItem from '@/components/menu_item';
import { useLocation, useNavigate } from 'react-router-dom';
import { CSSProperties, useContext } from 'react';
import { t } from '@/i18n';
import context from '../context';
import { ENABLE_FILE_SYSTEM } from '@/constants/browser';
import DownloadTag from './download_tag';
import { useUser } from '@/global_states/server';

const itemStyle: CSSProperties = { margin: '0 10px' };

function Menu() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const user = useUser()!;

  const { downloadingMusicList } = useContext(context);
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
      {ENABLE_FILE_SYSTEM && downloadingMusicList.length ? (
        <MenuItem
          style={itemStyle}
          active={
            pathname === `${ROOT_PATH.PLAYER}${PLAYER_PATH.DOWNLOADING_MUSIC}`
          }
          onClick={() =>
            navigate(`${ROOT_PATH.PLAYER}${PLAYER_PATH.DOWNLOADING_MUSIC}`)
          }
          label={t('download')}
          icon={<MdOutlineDownload />}
          suffix={<DownloadTag />}
        />
      ) : null}
      {user.admin ? (
        <MenuItem
          style={itemStyle}
          active={false}
          onClick={() => window.open(`#${ROOT_PATH.ADMIN}`, '_blank')}
          label={t('admin_panel')}
          icon={<MdAdminPanelSettings />}
        />
      ) : null}
    </div>
  );
}

export default Menu;

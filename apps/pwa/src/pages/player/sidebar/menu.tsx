import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import {
  MdLooks,
  MdOutlineSettings,
  MdOutlineMusicNote,
  MdPersonOutline,
} from 'react-icons/md';
import MenuItem from '#/components/menu_item';
import { useLocation, useNavigate } from 'react-router-dom';

function Menu() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <div>
      <MenuItem
        active={pathname === `${ROOT_PATH.PLAYER}${PLAYER_PATH.EXPLORE}`}
        onClick={() => navigate(`${ROOT_PATH.PLAYER}${PLAYER_PATH.EXPLORE}`)}
        label="发现"
        icon={<MdLooks />}
      />
      <MenuItem
        active={pathname === `${ROOT_PATH.PLAYER}${PLAYER_PATH.MY_MUSIC}`}
        onClick={() => navigate(`${ROOT_PATH.PLAYER}${PLAYER_PATH.MY_MUSIC}`)}
        label="我的音乐"
        icon={<MdOutlineMusicNote />}
      />
      <MenuItem
        active={pathname === `${ROOT_PATH.PLAYER}${PLAYER_PATH.MY_SINGER}`}
        onClick={() => navigate(`${ROOT_PATH.PLAYER}${PLAYER_PATH.MY_SINGER}`)}
        label="我的歌手"
        icon={<MdPersonOutline />}
      />
      <MenuItem
        active={pathname === `${ROOT_PATH.PLAYER}${PLAYER_PATH.SETTING}`}
        onClick={() => navigate(`${ROOT_PATH.PLAYER}${PLAYER_PATH.SETTING}`)}
        label="设置"
        icon={<MdOutlineSettings />}
      />
    </div>
  );
}

export default Menu;

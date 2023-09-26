import Button from '@/components/button';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import { t } from '@/i18n';
import { useNavigate } from 'react-router-dom';
import { CSSProperties } from 'styled-components';
import { itemStyle } from './constants';

const style: CSSProperties = {
  ...itemStyle,
  display: 'block',
  width: 'calc(100% - 40px)',
};

function UserManage() {
  const navigate = useNavigate();
  return (
    <Button
      style={style}
      onClick={() => navigate(ROOT_PATH.PLAYER + PLAYER_PATH.USER_MANAGE)}
    >
      {t('user_management')}
    </Button>
  );
}

export default UserManage;

import Button, { Variant } from '@/components/button';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import { t } from '@/i18n';
import { useNavigate } from 'react-router-dom';
import { buttonItemStyle } from './constants';

function UserManage() {
  const navigate = useNavigate();
  return (
    <Button
      variant={Variant.PRIMARY}
      style={buttonItemStyle}
      onClick={() => navigate(ROOT_PATH.PLAYER + PLAYER_PATH.USER_MANAGE)}
    >
      {t('user_management')}
    </Button>
  );
}

export default UserManage;

import Button, { Variant } from '#/components/button';
import { PLAYER_PATH, ROOT_PATH } from '@/constants/route';
import { useNavigate } from 'react-router-dom';
import { CSSProperties } from 'styled-components';

const style: CSSProperties = {
  display: 'block',
  margin: 20,
  width: 'calc(100% - 40px)',
};

function Admin() {
  const navigate = useNavigate();
  return (
    <Button
      variant={Variant.PRIMARY}
      style={style}
      onClick={() => navigate(ROOT_PATH.PLAYER + PLAYER_PATH.ADMIN)}
    >
      管理员菜单
    </Button>
  );
}

export default Admin;

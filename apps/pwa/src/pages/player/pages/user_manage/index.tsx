import styled from 'styled-components';
import Page from '../page';
import Toolbar from './toolbar';
import CreateUserDialog from './create_user_dialog';

const Style = styled(Page)`
  position: relative;
`;

function UserManage() {
  return (
    <Style>
      <Toolbar />

      <CreateUserDialog />
    </Style>
  );
}

export default UserManage;

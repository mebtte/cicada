import styled from 'styled-components';
import Page from '../page';
import Toolbar from './toolbar';
import CreateUserDialog from './create_user_dialog';
import UserList from './user_list';
import UserEditDrawer from './user_edit_drawer';

const Style = styled(Page)`
  position: relative;
`;

function UserManage() {
  return (
    <Style>
      <UserList />
      <Toolbar />

      <CreateUserDialog />
      <UserEditDrawer />
    </Style>
  );
}

export default UserManage;

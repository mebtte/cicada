import styled from 'styled-components';
import Page from '../page';
import Toolbar from './toolbar';
import CreateUserDialog from './create_user_dialog';
import UserList from './user_list';
import EditMenu from './edit_menu';
import UserDetail from './user_detail';

const Style = styled(Page)`
  position: relative;
`;

function UserManage() {
  return (
    <Style>
      <UserList />
      <Toolbar />

      <EditMenu />
      <CreateUserDialog />
      <UserDetail />
    </Style>
  );
}

export default UserManage;

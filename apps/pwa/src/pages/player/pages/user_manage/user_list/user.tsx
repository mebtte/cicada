import styled from 'styled-components';
import { User as UserType } from '../constants';

const Style = styled.div`
  display: inline-block;
`;

function User({ user }: { user: UserType }) {
  return <Style>styled_function_component</Style>;
}

export default User;

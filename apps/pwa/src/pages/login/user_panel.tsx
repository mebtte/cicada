import styled from 'styled-components';
import Paper from '@mui/material/Paper';
import { panelCSS } from './constants';

const Style = styled(Paper)`
  ${panelCSS}
`;

function UserPanel({ visible }: { visible: boolean }) {
  return <Style visible={visible ? 1 : 0}>styled_function_component</Style>;
}

export default UserPanel;

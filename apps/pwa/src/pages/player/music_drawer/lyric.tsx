import styled from 'styled-components';
import { MusicDetail } from './constants';

const Style = styled.div`
  min-height: 1000px;
`;

function Lyric({ music }: { music: MusicDetail }) {
  return <Style>styled_function_component</Style>;
}

export default Lyric;

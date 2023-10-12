import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';
import styled from 'styled-components';
import { Singer as SingerType } from './constants';

const Style = styled.div`
  font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  ${ellipsis}
`;

function Singer({ singer }: { singer: SingerType }) {
  return <Style>{singer.name}</Style>;
}

export default Singer;

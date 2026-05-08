import { CSSVariable } from '@/global_style';
import styled from 'styled-components';
import { Singer as SingerType } from './constants';

const Style = styled.div`
  font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
  font-size: ${CSSVariable.TEXT_SIZE_LARGE};
  font-weight: 900;
  line-height: 1.3;
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  text-overflow: ellipsis;
  word-break: break-word;

  &::after {
    content: '';
    display: block;
    width: min(72px, 70%);
    height: 6px;
    margin-top: 8px;

    border-radius: 999px;
    background: rgb(229 244 255);
  }
`;

function Singer({ singer }: { singer: SingerType }) {
  return <Style>{singer.name}</Style>;
}

export default Singer;

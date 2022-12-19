import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';
import styled from 'styled-components';
import Cover from './cover';
import { CardItem } from '../constants';

const Style = styled.div`
  flex-shrink: 0;

  width: 150px;

  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  > .title {
    margin-top: 5px;

    font-size: 14px;
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    text-align: center;

    ${ellipsis}
  }

  > .sub-title {
    font-size: 12px;
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
    text-align: center;

    ${ellipsis}
  }
`;

function Card({
  id,
  title,
  subTitle,
  cover,
  onItemClick,
}: CardItem & {
  onItemClick: (id: string) => void;
}) {
  return (
    <Style onClick={() => onItemClick(id)}>
      <Cover cover={cover} />
      <div className="title">{title}</div>
      {subTitle ? <div className="sub-title">{subTitle}</div> : null}
    </Style>
  );
}

export default Card;

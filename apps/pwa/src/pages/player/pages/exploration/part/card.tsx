import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';
import styled from 'styled-components';
import Cover from './cover';
import { CardItem } from '../constants';

const Style = styled.div`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  flex-direction: column;

  width: 150px;

  > .title {
    max-width: 100%;
    margin-top: 5px;

    font-size: 14px;
    color: ${CSSVariable.TEXT_COLOR_PRIMARY};
    text-align: center;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;

    ${ellipsis}

    &:hover {
      color: ${CSSVariable.COLOR_PRIMARY};
    }
  }
`;

function Card({
  id,
  title,
  subTitleRenderer,
  cover,
  onItemClick,
}: CardItem & {
  onItemClick: (id: string) => void;
}) {
  const onItemClickWrapper = () => onItemClick(id);
  return (
    <Style>
      <Cover cover={cover} onClick={onItemClickWrapper} />
      <div className="title" onClick={onItemClickWrapper}>
        {title}
      </div>
      {subTitleRenderer ? subTitleRenderer() : null}
    </Style>
  );
}

export default Card;

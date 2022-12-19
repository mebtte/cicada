import { CSSVariable } from '@/global_style';
import styled from 'styled-components';
import IconButton from '@/components/icon_button';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';
import { useLayoutEffect, useRef, useState } from 'react';
import Button, { Variant } from '@/components/button';
import { CardItem } from '../constants';
import Card from './card';

const ARROW_BUTTON_SIZE = 24;
const Style = styled.div`
  margin: 20px 0 10px 0;

  > .top {
    margin: 0 20px 10px 20px;

    display: flex;
    align-items: center;
    gap: 10px;

    > .title {
      flex: 1;
      min-width: 0;

      font-size: 16px;
      color: ${CSSVariable.TEXT_COLOR_PRIMARY};
      font-weight: bold;
    }
  }

  > .list {
    display: flex;
    align-items: flex-start;
    flex-wrap: nowrap;
    gap: 10px;

    padding: 0 20px 10px 20px;

    overflow: auto;
  }

  > .empty {
    padding: 10px 20px;
  }
`;

function Part({
  title,
  list,
  onItemClick,
  onCreate,
}: {
  title: string;
  list: CardItem[];
  onItemClick: (id: string) => void;
  onCreate?: () => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const [leftArrowDisabled, setLeftArrowDisabled] = useState(false);
  const [rightArrowDisabled, setRightArrowDisabled] = useState(false);

  const onScroll = () => {
    const { scrollLeft, clientWidth, scrollWidth } = listRef.current!;
    setLeftArrowDisabled(scrollLeft === 0);
    setRightArrowDisabled(scrollLeft + clientWidth === scrollWidth);
  };
  const toLeft = () =>
    listRef.current!.scrollTo({
      left: listRef.current!.scrollLeft - listRef.current!.clientWidth,
      behavior: 'smooth',
    });
  const toRight = () =>
    listRef.current!.scrollTo({
      left: listRef.current!.scrollLeft + listRef.current!.clientWidth,
      behavior: 'smooth',
    });

  useLayoutEffect(() => {
    if (listRef.current) {
      const { scrollLeft, clientWidth, scrollWidth } = listRef.current!;
      setLeftArrowDisabled(scrollLeft === 0);
      setRightArrowDisabled(scrollLeft + clientWidth === scrollWidth);
    }
  }, []);

  return (
    <Style>
      <div className="top">
        <div className="title">{title}</div>
        {list.length ? (
          <>
            <IconButton
              size={ARROW_BUTTON_SIZE}
              disabled={leftArrowDisabled}
              onClick={toLeft}
            >
              <MdChevronLeft />
            </IconButton>
            <IconButton
              size={ARROW_BUTTON_SIZE}
              disabled={rightArrowDisabled}
              onClick={toRight}
            >
              <MdChevronRight />
            </IconButton>
          </>
        ) : null}
      </div>
      {list.length ? (
        <div className="list" ref={listRef} onScroll={onScroll}>
          {list.map((item) => (
            <Card key={item.id} {...item} onItemClick={onItemClick} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <Button variant={Variant.PRIMARY} onClick={onCreate}>
            创建{title}
          </Button>
        </div>
      )}
    </Style>
  );
}

export default Part;

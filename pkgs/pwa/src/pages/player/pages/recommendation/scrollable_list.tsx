import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import IconButton, { Name } from '@/components/icon_button';
import scrollbarNever from '@/style/scrollbar_never';
import { COVER_SIZE } from './constants';

const BUTTON_SIZE = 24;
const ITEM_SPACE = 10;
const Style = styled.div`
  display: flex;
  align-items: flex-start;

  > .action-box {
    padding-top: ${COVER_SIZE / 2 - BUTTON_SIZE / 2 + ITEM_SPACE}px;
    width: 40px;

    display: flex;
    justify-content: center;
  }
`;
const List = styled.div`
  flex: 1;
  min-width: 0;

  overflow: auto;
  ${scrollbarNever}
  scroll-behavior: smooth;

  margin-top: ${ITEM_SPACE}px;

  display: flex;
  align-items: center;
  gap: ${ITEM_SPACE}px;
`;

const ScrollableList = ({
  children,
  ...props
}: React.PropsWithChildren<{
  [key: string]: any;
}>) => {
  const listRef = useRef<HTMLDivElement>(null);

  const [leftDisabled, setLeftDisabled] = useState(false);
  const [rightDisabled, setRightDisabled] = useState(false);

  const detectDisabled = useCallback(() => {
    const { scrollWidth, scrollLeft, clientWidth } = listRef.current!;
    if (scrollLeft === 0) {
      setLeftDisabled(true);
    } else {
      setLeftDisabled(false);
    }

    if (scrollLeft + clientWidth === scrollWidth) {
      setRightDisabled(true);
    } else {
      setRightDisabled(false);
    }
  }, []);

  const onScroll = () => {
    detectDisabled();
  };
  const onLeft = () => {
    const { scrollLeft, children: listChildren } = listRef.current!;

    let offset = 0;
    for (let i = 0, { length } = listChildren; i < length; i += 1) {
      const child = listChildren[i];
      offset += child.clientWidth + (i > 0 ? ITEM_SPACE : 0);
      if (offset >= scrollLeft) {
        const sl = offset - child.clientWidth;
        listRef.current!.scrollLeft =
          sl === scrollLeft
            ? scrollLeft - (listChildren[i - 1].clientWidth + ITEM_SPACE)
            : sl;
        break;
      }
    }
  };
  const onRight = () => {
    const {
      scrollLeft,
      clientWidth,
      children: listChildren,
    } = listRef.current!;

    const target = scrollLeft + clientWidth;
    let offset = 0;
    for (let i = 0, { length } = listChildren; i < length; i += 1) {
      const child = listChildren[i];
      offset += child.clientWidth + (i > 0 ? ITEM_SPACE : 0);
      if (offset > target) {
        listRef.current!.scrollLeft = offset - clientWidth;
        break;
      }
    }
  };

  useLayoutEffect(() => {
    detectDisabled();
  }, [detectDisabled, children]);

  return (
    <Style {...props}>
      <div className="action-box">
        <IconButton
          name={Name.LEFT_OUTLINE}
          size={BUTTON_SIZE}
          disabled={leftDisabled}
          onClick={onLeft}
        />
      </div>
      <List ref={listRef} onScroll={onScroll}>
        {children}
      </List>
      <div className="action-box">
        <IconButton
          name={Name.RIGHT_OUTLINE}
          size={BUTTON_SIZE}
          disabled={rightDisabled}
          onClick={onRight}
        />
      </div>
    </Style>
  );
};

export default ScrollableList;

import { memo, useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { ComponentSize } from '../../constants/style';
import { Item as ItemType } from './constants';

const Style = styled.div<{
  open: boolean;
}>`
  z-index: 1;

  position: absolute;
  top: calc(100% + 2px);
  left: 0;
  width: 100%;

  transition: 300ms;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: rgb(0 0 0 / 20%) 0px 5px 5px -3px,
    rgb(0 0 0 / 14%) 0px 8px 10px 1px, rgb(0 0 0 / 12%) 0px 3px 14px 2px;

  ${({ open }) => css`
    pointer-events: ${open ? 'auto' : 'none'};
    opacity: ${open ? 1 : 0};
    transform: translateY(${open ? 0 : ComponentSize.NORMAL}px);
  `}
`;

function Options<ID extends string | number>({
  open,
  keyword,
  dataGetter,
  onGetDataError,
}: {
  open: boolean;
  keyword: string;
  dataGetter: (search: string) => ItemType<ID>[] | Promise<ItemType<ID>[]>;
  onGetDataError: (error: Error) => void;
}) {
  const requestIdRef = useRef<number>(0);

  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<ItemType<ID>[]>([]);

  useEffect(() => {
    if (open) {
      setLoading(true);
      const timer = window.setTimeout(async () => {
        const requestId = Math.random();
        requestIdRef.current = requestId;
        try {
          const data = await dataGetter(keyword);
          if (requestId === requestIdRef.current) {
            setOptions(data);
          }
        } catch (error) {
          if (requestId === requestIdRef.current) {
            onGetDataError(error);
          }
        }

        return setLoading(false);
      }, 1000);
      return () => window.clearTimeout(timer);
    }
  }, [keyword, dataGetter, onGetDataError, open]);

  return <Style open={open}>{keyword}</Style>;
}

export default memo(Options, (prevProps, props) => {
  if (!prevProps.open && !props.open) {
    return true;
  }
  return false;
});

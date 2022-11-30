import { ForwardedRef, forwardRef, HtmlHTMLAttributes, useId } from 'react';
import styled, { css } from 'styled-components';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md';
import { flexCenter } from '#/style/flexbox';
import { CSSVariable } from '#/global_style';
import usePages from './use_pages';
import CustomPage from './custom_page';

const Style = styled.div`
  ${flexCenter}
  gap: 10px;
`;
const Button = styled.button<{ active?: boolean }>`
  width: 24px;
  height: 24px;

  ${flexCenter}

  font-size: 12px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  transition: 300ms;
  user-select: none;

  > svg {
    width: 24px;
    height: 24px;
  }

  &:hover {
    background-color: rgb(0 0 0 / 0.05);
  }

  &:active {
    background-color: rgb(0 0 0 / 0.1);
  }

  &:disabled {
    cursor: not-allowed;
    background-color: transparent;
    color: ${CSSVariable.TEXT_COLOR_DISABLED};
  }

  ${({ active = false }) => css`
    background-color: ${active
      ? `${CSSVariable.COLOR_PRIMARY} !important`
      : 'transparent'};
    color: ${active ? '#fff !important' : CSSVariable.TEXT_COLOR_PRIMARY};
  `}
`;
type Props = Omit<HtmlHTMLAttributes<HTMLDivElement>, 'onChange'> & {
  total: number;
  pageSize: number;
  page: number;
  onChange: (page: number) => void;
};

function Pagination(
  { total, pageSize, page, onChange, ...props }: Props,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const id = useId();

  const totalPage = Math.ceil(total / pageSize);
  const pages = usePages({ id, page, totalPage, onChange });

  return (
    <>
      <Style {...props} ref={ref}>
        <Button disabled={page === 1} onClick={() => onChange(page - 1)}>
          <MdKeyboardArrowLeft />
        </Button>
        {pages.map((p, index) => (
          <Button
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            active={p.active}
            onClick={p.onClick}
          >
            {p.text}
          </Button>
        ))}
        <Button
          disabled={page === totalPage}
          onClick={() => onChange(page + 1)}
        >
          <MdKeyboardArrowRight />
        </Button>
      </Style>
      <CustomPage id={id} totalPage={totalPage} onChange={onChange} />
    </>
  );
}

export default forwardRef<HTMLDivElement, Props>(Pagination);

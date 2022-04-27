/* eslint-disable no-nested-ternary */
import React, { useState } from 'react';
import styled from 'styled-components';

import Button, { Type } from '../button';
import Input from '../input';
import IconButton, { Name } from '../icon_button';
import Tooltip from '../tooltip';

const ACTION_SIZE = 20;
const Style = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  > .page {
    margin: 0 4px;
  }
  > .ellipsis {
    font-size: 12px;
    color: rgb(222 222 222);
  }
  > .separator {
    width: 1px;
    height: ${ACTION_SIZE}px;
    background-color: rgb(244 244 244);
    margin: 0 10px;
  }
`;
const StyledInput = styled(Input)`
  height: ${ACTION_SIZE}px;
  font-size: 12px;
  text-align: center;
  width: 40px;
  padding: 0 5px;
  appearance: textfield;
  margin: 0 4px;
  &::-webkit-inner-spin-button {
    appearance: none;
  }
`;

/**
 * 页码
 * @author mebtte<hi@mebtte.com>
 */
const Pagination = ({
  currentPage,
  pageCount,
  onPageChange,
  ...props
}: {
  /** 当前页码 */
  currentPage: number;
  /** 总页数 */
  pageCount: number;
  /** 切换页面回调 */
  onPageChange?: (page: number) => void;
  [key: string]: any;
}) => {
  const [customPage, setCustomPage] = useState('');
  const onCustomPageChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setCustomPage(event.target.value);
  const onGoto = () => {
    let targetPage = +customPage;
    if (!targetPage || targetPage <= 1) {
      targetPage = 1;
    } else if (targetPage >= pageCount) {
      targetPage = pageCount;
    }
    setCustomPage(targetPage.toString());
    onPageChange(targetPage);
  };
  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (event.key === 'Enter') {
      onGoto();
    }
  };

  return (
    <Style {...props}>
      {currentPage > 2 && (
        <Button
          className="page"
          label="1"
          size={ACTION_SIZE}
          onClick={() => onPageChange(1)}
        />
      )}
      {currentPage >= 4 ? (
        currentPage === 4 ? (
          <Button
            className="page"
            label="2"
            size={ACTION_SIZE}
            onClick={() => onPageChange(2)}
          />
        ) : (
          <div className="ellipsis page">···</div>
        )
      ) : null}
      {currentPage - 1 >= 1 && (
        <Button
          className="page"
          label={currentPage - 1}
          size={ACTION_SIZE}
          onClick={() => onPageChange(currentPage - 1)}
        />
      )}
      <Button
        className="page"
        label={currentPage}
        type={Type.PRIMARY}
        size={ACTION_SIZE}
      />
      {currentPage + 1 <= pageCount && (
        <Button
          className="page"
          label={currentPage + 1}
          size={ACTION_SIZE}
          onClick={() => onPageChange(currentPage + 1)}
        />
      )}
      {pageCount - currentPage >= 3 ? (
        pageCount - currentPage === 3 ? (
          <Button
            className="page"
            label={pageCount - 1}
            size={ACTION_SIZE}
            onClick={() => onPageChange(pageCount - 1)}
          />
        ) : (
          <div className="ellipsis page">···</div>
        )
      ) : null}
      {pageCount > currentPage + 1 && (
        <Button
          className="page"
          label={pageCount}
          size={ACTION_SIZE}
          onClick={() => onPageChange(pageCount)}
        />
      )}
      {pageCount > 3 && (
        <>
          <div className="separator" />
          <StyledInput
            type="number"
            value={customPage}
            onChange={onCustomPageChange}
            onKeyDown={onKeyDown}
          />
          <Tooltip title="跳转到页面">
            <IconButton
              name={Name.GOTO_OUTLINE}
              size={ACTION_SIZE}
              onClick={onGoto}
            />
          </Tooltip>
        </>
      )}
    </Style>
  );
};

export default Pagination;

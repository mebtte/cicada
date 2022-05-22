import { memo, useMemo } from 'react';
import styled from 'styled-components';

import env from '@/env';
import getRandomInteger from '#/utils/generate_random_integer';
import Avatar from '../avatar';
import IconButton, { Name } from '../icon_button';

const PLACEHOLDER_SIZE = 150;
const Style = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  > .error-message {
    max-width: 400px;
    white-space: pre-wrap;
    font-size: 12px;
    line-height: 1.5;
    text-align: center;
    color: rgb(150 150 150);
  }
`;

/**
 * 错误卡片
 * @author mebtte<hi@mebtte.com>
 */
function ErrorCard({
  errorMessage,
  retry,
  ...props
}: {
  /** 错误信息 */
  errorMessage: string;
  /** 重试方法 */
  retry: () => void;
  [key: string]: unknown;
}) {
  const errorImage = useMemo(
    () =>
      env.ERROR_IMAGE_LIST[getRandomInteger(0, env.ERROR_IMAGE_LIST.length)],
    [],
  );
  return (
    <Style {...props}>
      <Avatar animated src={errorImage} size={PLACEHOLDER_SIZE} />
      <div className="error-message">{errorMessage}</div>
      <IconButton name={Name.REFRESH_OUTLINE} onClick={retry} size={24} />
    </Style>
  );
}

export default memo(ErrorCard);

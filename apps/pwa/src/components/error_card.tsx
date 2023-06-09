import { memo, useMemo } from 'react';
import styled from 'styled-components';
import IconButton from '@/components/icon_button';
import definition from '@/definition';
import getRandomInteger from '#/utils/generate_random_integer';
import { MdRefresh } from 'react-icons/md';
import { CSSVariable } from '@/global_style';

const Style = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;

  color: ${CSSVariable.TEXT_COLOR_SECONDARY};

  > .placeholder {
    width: 100px;
  }

  > .error-message {
    max-width: 400px;

    white-space: pre-wrap;
    font-size: 12px;
    line-height: 1.5;
    text-align: center;
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
      definition.ERROR_IMAGE_LIST[
        getRandomInteger(0, definition.ERROR_IMAGE_LIST.length)
      ],
    [],
  );
  return (
    <Style {...props}>
      <img
        className="placeholder"
        src={errorImage}
        alt="error"
        crossOrigin="anonymous"
        loading="lazy"
      />
      <div className="error-message">{errorMessage}</div>
      <IconButton onClick={retry}>
        <MdRefresh />
      </IconButton>
    </Style>
  );
}

export default memo(ErrorCard);

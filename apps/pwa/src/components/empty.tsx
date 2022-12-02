import { memo, useMemo } from 'react';
import styled from 'styled-components';
import env from '@/env';
import getRandomInteger from '#/utils/generate_random_integer';
import { CSSVariable } from '#/global_style';

const Style = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;

  > .placeholder {
    width: 180px;
  }

  > .description {
    font-size: 12px;
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  }
`;

/**
 * 空数据
 * @author mebtte<hi@mebtte.com>
 */
function Empty({
  /** 描述 */
  description = '暂时没有数据',
  ...props
}: {
  description?: string;
  [key: string]: unknown;
}) {
  const emptyImage = useMemo(
    () =>
      env.EMPTY_IMAGE_LIST[getRandomInteger(0, env.EMPTY_IMAGE_LIST.length)],
    [],
  );
  return (
    <Style {...props}>
      <img
        className="placeholder"
        src={emptyImage}
        alt="empty"
        crossOrigin="anonymous"
        loading="lazy"
      />
      <div className="description">{description}</div>
    </Style>
  );
}

export default memo(Empty);

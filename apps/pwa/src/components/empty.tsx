import { memo, useMemo } from 'react';
import styled from 'styled-components';
import definition from '@/definition';
import getRandomInteger from '#/utils/generate_random_integer';
import { CSSVariable } from '@/global_style';
import capitalize from '@/style/capitalize';

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
    font-size: ${CSSVariable.TEXT_SIZE_SMALL};
    color: ${CSSVariable.TEXT_COLOR_SECONDARY};

    ${capitalize}
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
      definition.EMPTY_IMAGE_LIST[
        getRandomInteger(0, definition.EMPTY_IMAGE_LIST.length)
      ],
    [],
  );
  return (
    <Style {...props}>
      <img
        className="placeholder"
        src={emptyImage}
        alt="empty"
        crossOrigin="anonymous"
      />
      <div className="description">{description}</div>
    </Style>
  );
}

export default memo(Empty);

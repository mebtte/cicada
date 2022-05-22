import { memo, useMemo } from 'react';
import styled from 'styled-components';

import env from '@/env';
import getRandomInteger from '#/utils/generate_random_integer';
import Avatar from '../avatar';

const Style = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  > .placeholder {
    margin-bottom: 15px;
  }
  > .description {
    font-size: 12px;
    color: rgb(155 155 155);
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
      <Avatar className="placeholder" animated src={emptyImage} size={180} />
      <div className="description">{description}</div>
    </Style>
  );
}

export default memo(Empty);

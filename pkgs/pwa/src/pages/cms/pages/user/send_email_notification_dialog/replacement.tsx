import React from 'react';
import styled from 'styled-components';

const Style = styled.div`
  font-size: 12px;
  color: var(--text-color-secondary);
  line-height: 1.3;
`;
const REPLACEMENT_MAP = {
  '{{to_user_nickname}}': '目标用户昵称',
  '{{send_user_nickname}}': '你的用户昵称',
  '{{create_time}}': '邮件通知创建时间, YYYY-MM-DD HH:mm',
};

const Replacement = () => (
  <Style>
    <div>内容 HTML 支持以下变量替换:</div>
    {Object.keys(REPLACEMENT_MAP).map((replacement) => (
      <div key={replacement}>
        {replacement}: {REPLACEMENT_MAP[replacement]}
      </div>
    ))}
  </Style>
);

export default React.memo(Replacement);

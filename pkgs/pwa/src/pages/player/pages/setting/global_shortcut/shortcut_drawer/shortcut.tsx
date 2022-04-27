import React from 'react';
import styled from 'styled-components';

import IconButton, { Name } from '@/components/icon_button';

const Style = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 15px;
  margin: 10px 20px;
  background-color: rgb(0 0 0 / 0.05);
  border-radius: 4px;
  > .label {
    flex: 1;
    min-width: 0;
    font-size: 12px;
    color: rgb(55 55 55);
  }
  > .shortcut {
    font-size: 12px;
    margin: 0 10px;
    color: rgb(155 155 155);
    > .key {
      &:not(:last-child)::after {
        content: ' + ';
        color: rgb(222 222 222);
      }
    }
  }
`;

const Shortcut = ({
  label,
  keys,
  onEdit,
}: {
  label: string;
  keys: string[];
  onEdit: () => void;
}) => (
  <Style>
    <div className="label">{label}</div>
    {keys.length ? (
      <div className="shortcut">
        {keys.map((key) => (
          <span key={key} className="key">
            {key}
          </span>
        ))}
      </div>
    ) : null}
    <IconButton name={Name.EDIT_OUTLINE} size={20} onClick={onEdit} />
  </Style>
);

export default Shortcut;

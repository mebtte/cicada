import React from 'react';
import styled from 'styled-components';

import Icon from '@/components/icon';
import { Project, HORIZONTAL_LAYOUT_WIDTH } from './constants';

const Style = styled.a`
  text-decoration: none;
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 10px;
  border-radius: 4px;
  &:hover {
    background: rgb(255 255 255 / 0.1);
  }
  > .icon {
    color: #555;
  }
  > .info {
    > .name {
      font-size: 14px;
      color: #333;
    }
    > .description {
      font-size: 12px;
      color: #555;
      margin-top: 5px;
    }
  }

  @media (max-width: ${HORIZONTAL_LAYOUT_WIDTH}px) {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
`;

const ProjectItem = ({ project }: { project: Project }) => (
  <Style href={project.link}>
    <Icon className="icon" name={project.icon} size={32} />
    <div className="info">
      <div className="name">{project.name}</div>
      <div className="description">{project.description}</div>
    </div>
  </Style>
);

export default ProjectItem;

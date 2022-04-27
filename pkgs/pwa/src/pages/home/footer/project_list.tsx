import React from 'react';
import styled from 'styled-components';

import { Name } from '@/components/icon';
import {
  ELECTRON_GITHUB_REPOSITORY,
  EXPO_GITHUB_REPOSITORY,
  PWA_GITHUB_REPOSITORY,
  SERVER_GITHUB_REPOSITORY,
} from '@/constants';
import ProjectItem from './project_item';
import { Project as ProjectType, HORIZONTAL_LAYOUT_WIDTH } from './constants';

const Style = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;

  @media (max-width: ${HORIZONTAL_LAYOUT_WIDTH}px) {
    align-items: center;
  }
`;
const PROJECTS: ProjectType[] = [
  {
    icon: Name.CLOUD_OUTLINE,
    name: 'Cicada Server',
    link: SERVER_GITHUB_REPOSITORY,
    description: '知了服务器端',
  },
  {
    icon: Name.BROWSER_FILL,
    name: 'Cicada PWA',
    link: PWA_GITHUB_REPOSITORY,
    description: '知了浏览器端',
  },
  {
    icon: Name.COMPUTER_FILL,
    name: 'Cicada Electron',
    link: ELECTRON_GITHUB_REPOSITORY,
    description: '知了桌面客户端',
  },
  {
    icon: Name.MOBILEPHONE_FILL,
    name: 'Cicada Expo',
    link: EXPO_GITHUB_REPOSITORY,
    description: '知了移动客户端',
  },
];

const ProjectList = () => (
  <Style>
    {PROJECTS.map((p, i) => (
      // eslint-disable-next-line react/no-array-index-key
      <ProjectItem key={i} project={p} />
    ))}
  </Style>
);

export default ProjectList;

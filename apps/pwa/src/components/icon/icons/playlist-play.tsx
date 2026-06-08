import Icon, { IconProps } from '../base';

function PlaylistPlay(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M4 7 H14" />
      <path d="M4 12 H13" />
      <path d="M4 17 H9" />
      <path d="M13.5 14 L19 17 L13.5 20 Z" fill="currentColor" />
    </Icon>
  );
}

export default PlaylistPlay;

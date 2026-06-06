import Icon, { IconProps } from '../base';

function PlaylistRemove(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M4 7 H16" />
      <path d="M4 12 H16" />
      <path d="M4 17 H11" />
      <path d="M14 17 H20" />
    </Icon>
  );
}

export default PlaylistRemove;

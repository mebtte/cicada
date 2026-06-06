import Icon, { IconProps } from '../base';

function PlaylistAdd(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <line x1="4" y1="7"  x2="16" y2="7"  />
      <line x1="4" y1="12" x2="16" y2="12" />
      <line x1="4" y1="17" x2="11" y2="17" />
      <line x1="17" y1="14"   x2="17" y2="20"   />
      <line x1="14" y1="17"   x2="20" y2="17"   />
    </Icon>
  );
}

export default PlaylistAdd;

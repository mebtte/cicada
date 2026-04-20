import Icon, { IconProps } from '../base';

function IconPlayQueue(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M3 5.5 L3 11.5 L9 8.5 Z" fill="currentColor" stroke="none" />
      <line x1="12" y1="8.5" x2="21" y2="8.5" />
      <line x1="3"  y1="15"  x2="21" y2="15"  />
      <line x1="3"  y1="20"  x2="21" y2="20"  />
    </Icon>
  );
}

export default IconPlayQueue;

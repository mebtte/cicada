import Icon, { IconProps } from '../base';

function IconPlayQueue(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      {/* triangle centred at y=7, matching the top line of IconList */}
      <path d="M3 4.5 L3 9.5 L8.5 7 Z" fill="currentColor" stroke="none" />
      <line x1="11" y1="7"  x2="21" y2="7"  />
      <line x1="3"  y1="12" x2="21" y2="12" />
      <line x1="3"  y1="17" x2="21" y2="17" />
    </Icon>
  );
}

export default IconPlayQueue;

import Icon, { IconProps } from '../base';

function List(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="5" cy="5.5"  r="1.3" fill="currentColor" stroke="none" />
      <circle cx="5" cy="12"   r="1.3" fill="currentColor" stroke="none" />
      <circle cx="5" cy="18.5" r="1.3" fill="currentColor" stroke="none" />
      <line x1="9.5" y1="5.5"  x2="20"   y2="5.5"  />
      <line x1="9.5" y1="12"   x2="18"   y2="12"   />
      <line x1="9.5" y1="18.5" x2="19.5" y2="18.5" />
    </Icon>
  );
}

export default List;

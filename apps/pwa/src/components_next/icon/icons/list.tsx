import Icon, { IconProps } from '../base';

function IconList(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <line x1="3" y1="7"  x2="21" y2="7"  />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="17" x2="21" y2="17" />
    </Icon>
  );
}

export default IconList;

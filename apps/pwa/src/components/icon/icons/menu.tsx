import Icon, { IconProps } from '../base';

function Menu(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M5 7 H19" />
      <path d="M5 12 H16.5" />
      <path d="M5 17 H19" />
    </Icon>
  );
}

export default Menu;

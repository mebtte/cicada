import Icon, { IconProps } from '../base';

function Logout(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M10 5 H6.5 A2 2 0 0 0 4.5 7 V17 A2 2 0 0 0 6.5 19 H10" />
      <path d="M15 8 L19 12 L15 16" />
      <path d="M9 12 H19" />
    </Icon>
  );
}

export default Logout;

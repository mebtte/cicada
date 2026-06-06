import Icon, { IconProps } from '../base';

function DeleteSweep(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M4 7 H14.5" />
      <path d="M7.5 7 V5.5 A1.5 1.5 0 0 1 9 4 H11.5 A1.5 1.5 0 0 1 13 5.5 V7" />
      <path d="M6 7 L6.8 18.3 A2 2 0 0 0 8.8 20 H12.2 A2 2 0 0 0 14.2 18.3 L15 7" />
      <path d="M17 10 H21" />
      <path d="M16 14 H20" />
      <path d="M17 18 H19.5" />
    </Icon>
  );
}

export default DeleteSweep;

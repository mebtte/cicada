import Icon, { IconProps } from '../base';

function Exit(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M11 5 H8 A2 2 0 0 0 6 7 V17 A2 2 0 0 0 8 19 H11" />
      <path d="M15 8 L19 12 L15 16" />
      <path d="M10 12 H19" />
    </Icon>
  );
}

export default Exit;

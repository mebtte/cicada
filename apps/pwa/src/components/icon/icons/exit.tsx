import Icon, { IconProps } from '../base';

function Exit(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M10 5 H6.5 A2 2 0 0 0 4.5 7 V17 A2 2 0 0 0 6.5 19 H10" />
      <path d="M13 8 L17 12 L13 16" />
      <path d="M8.5 12 H17" />
    </Icon>
  );
}

export default Exit;

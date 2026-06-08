import Icon, { IconProps } from '../base';

function Sort(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M6 7 H18" />
      <path d="M8 12 H16" />
      <path d="M10 17 H14" />
    </Icon>
  );
}

export default Sort;

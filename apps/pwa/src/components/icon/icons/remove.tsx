import Icon, { IconProps } from '../base';

function Remove(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M5 12 H19" />
    </Icon>
  );
}

export default Remove;

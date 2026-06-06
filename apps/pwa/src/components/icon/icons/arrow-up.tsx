import Icon, { IconProps } from '../base';

function ArrowUp(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M12 19 V5" />
      <path d="M6.5 10.5 L12 5 L17.5 10.5" />
    </Icon>
  );
}

export default ArrowUp;

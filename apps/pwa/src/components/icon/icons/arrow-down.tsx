import Icon, { IconProps } from '../base';

function ArrowDown(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M12 5 V19" />
      <path d="M6.5 13.5 L12 19 L17.5 13.5" />
    </Icon>
  );
}

export default ArrowDown;

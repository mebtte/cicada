import Icon, { IconProps } from '../base';

function ChevronDown(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M6 9 L12 15 L18 9" />
    </Icon>
  );
}

export default ChevronDown;

import Icon, { IconProps } from '../base';

function ChevronUp(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M6 15 L12 9 L18 15" />
    </Icon>
  );
}

export default ChevronUp;

import Icon, { IconProps } from '../base';

function ChevronLeft(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M15 6 L9 12 L15 18" />
    </Icon>
  );
}

export default ChevronLeft;

import Icon, { IconProps } from '../base';

function ChevronRight(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M9 6 L15 12 L9 18" />
    </Icon>
  );
}

export default ChevronRight;

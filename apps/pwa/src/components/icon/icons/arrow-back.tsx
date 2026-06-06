import Icon, { IconProps } from '../base';

function ArrowBack(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M11 6 L5 12 L11 18" />
      <path d="M6 12 H20" />
    </Icon>
  );
}

export default ArrowBack;

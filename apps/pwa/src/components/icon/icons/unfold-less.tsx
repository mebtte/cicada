import Icon, { IconProps } from '../base';

function UnfoldLess(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M7 6 L12 10 L17 6" />
      <path d="M7 18 L12 14 L17 18" />
    </Icon>
  );
}

export default UnfoldLess;

import Icon, { IconProps } from '../base';

function UnfoldLess(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M7 9 L12 4.5 L17 9" />
      <path d="M7 15 L12 19.5 L17 15" />
    </Icon>
  );
}

export default UnfoldLess;

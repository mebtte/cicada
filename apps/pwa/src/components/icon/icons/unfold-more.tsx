import Icon, { IconProps } from '../base';

function UnfoldMore(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M7 10 L12 6 L17 10" />
      <path d="M7 14 L12 18 L17 14" />
    </Icon>
  );
}

export default UnfoldMore;

import Icon, { IconProps } from '../base';

function UnfoldMore(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M7 7 L12 12 L17 7" />
      <path d="M7 17 L12 12 L17 17" />
    </Icon>
  );
}

export default UnfoldMore;

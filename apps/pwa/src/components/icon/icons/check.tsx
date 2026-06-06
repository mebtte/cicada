import Icon, { IconProps } from '../base';

function Check(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M5 12.4 L10 17 L19 7.5" />
    </Icon>
  );
}

export default Check;

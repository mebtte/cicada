import Icon, { IconProps } from '../base';

function IconCheckCircle(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12 L11 15 L16.5 9.5" />
    </Icon>
  );
}

export default IconCheckCircle;

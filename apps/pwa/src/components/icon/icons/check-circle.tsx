import Icon, { IconProps } from '../base';

function CheckCircle(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8 12 L11 14.7 L16 9.5" />
    </Icon>
  );
}

export default CheckCircle;

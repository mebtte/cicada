import Icon, { IconProps } from '../base';

function Speed(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M5 17 A8 8 0 1 1 19 17" />
      <path d="M12 17 L16.5 9.5" />
      <circle cx="12" cy="17" r="1.2" fill="currentColor" stroke="none" />
      <path d="M7.5 15 H6" />
      <path d="M18 15 H16.5" />
    </Icon>
  );
}

export default Speed;

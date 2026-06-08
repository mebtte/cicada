import Icon, { IconProps } from '../base';

function Info(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11 V16" />
      <circle cx="12" cy="7.8" r="0.9" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export default Info;

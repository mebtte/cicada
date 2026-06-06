import Icon, { IconProps } from '../base';

function Error(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5 V13" />
      <circle cx="12" cy="16.6" r="0.9" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export default Error;

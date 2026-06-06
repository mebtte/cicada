import Icon, { IconProps } from '../base';

function Password(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <rect x="4" y="7" width="16" height="11" rx="2.5" />
      <circle cx="8" cy="12.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="12.5" r="1" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export default Password;

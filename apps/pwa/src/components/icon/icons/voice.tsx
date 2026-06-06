import Icon, { IconProps } from '../base';

function Voice(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8.5" r="3" fill="currentColor" stroke="none" />
      <path d="M4.5 18 C5.3 15.4 7 14 9 14 C11 14 12.7 15.4 13.5 18" />
      <path d="M15.5 8.2 C17.4 9.7 17.4 13.3 15.5 14.8" />
      <path d="M18.5 5.8 C21.2 8.6 21.2 13.4 18.5 16.2" />
    </Icon>
  );
}

export default Voice;

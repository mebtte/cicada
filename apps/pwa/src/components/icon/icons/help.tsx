import Icon, { IconProps } from '../base';

function Help(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M9.8 10 C9.8 7.5 14.2 7.5 14.2 10 C14.2 11.5 12 11.5 12 13.5" />
      <circle cx="12" cy="16.7" r="0.9" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export default Help;

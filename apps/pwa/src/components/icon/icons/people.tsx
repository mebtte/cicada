import Icon, { IconProps } from '../base';

function People(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8.5" r="3" fill="currentColor" stroke="none" />
      <path d="M4 18 C4.9 15.2 6.8 13.8 9 13.8 C11.2 13.8 13.1 15.2 14 18" />
      <circle cx="16.2" cy="9.5" r="2.4" fill="currentColor" stroke="none" opacity="0.72" />
      <path d="M14.8 14.5 C16.9 14.7 18.5 16 19.2 18" />
    </Icon>
  );
}

export default People;

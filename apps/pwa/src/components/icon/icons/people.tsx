import Icon, { IconProps } from '../base';

function People(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="9.5" cy="8.5" r="3" />
      <path d="M4.5 19 C5.4 15.7 7.1 14 9.5 14 C11.9 14 13.6 15.7 14.5 19" />
      <path d="M15.4 6.4 C16.9 6.7 18 7.9 18 9.5 C18 11 17 12.2 15.6 12.6" />
      <path d="M15.8 14.7 C17.7 15.2 19.1 16.6 19.8 19" />
    </Icon>
  );
}

export default People;

import Icon, { IconProps } from '../base';

function Person(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20 C6.1 16 8.4 14 12 14 C15.6 14 17.9 16 19 20" />
    </Icon>
  );
}

export default Person;

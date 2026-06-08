import Icon, { IconProps } from '../base';

function Key(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="8.5" cy="13.5" r="3.8" />
      <path d="M11.4 10.8 L19.5 4.5" />
      <path d="M16.3 7.2 L18.3 9.2" />
      <path d="M14.2 8.9 L16.1 10.8" />
    </Icon>
  );
}

export default Key;

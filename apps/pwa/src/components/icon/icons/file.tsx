import Icon, { IconProps } from '../base';

function File(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M6 4 H14.5 L19 8.5 V19 A2 2 0 0 1 17 21 H6 A2 2 0 0 1 4 19 V6 A2 2 0 0 1 6 4 Z" />
      <path d="M14.5 4 V8.5 H19" />
      <path d="M8 13 H16" />
      <path d="M8 16.5 H13" />
    </Icon>
  );
}

export default File;

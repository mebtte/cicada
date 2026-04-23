import Icon, { IconProps } from '../base';

function IconEdit(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M4 20 L8.5 19 L18.5 9 L15 5.5 L5 15.5 Z" />
      <path d="M13.5 7 L17 10.5" />
      <path d="M15 5.5 L16.2 4.3 A2 2 0 0 1 19 4.3 L19.7 5 A2 2 0 0 1 19.7 7.8 L18.5 9" />
    </Icon>
  );
}

export default IconEdit;

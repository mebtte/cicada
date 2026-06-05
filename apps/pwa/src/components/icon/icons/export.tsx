import Icon, { IconProps } from '../base';

function Export(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M6 4 H14.5 L20 9.5 V18 A2 2 0 0 1 18 20 H6 A2 2 0 0 1 4 18 V6 A2 2 0 0 1 6 4 Z" />
      <path d="M14.5 4 V9.5 H20" />
      <path d="M12 16.5 V11" />
      <path d="M8.7 13.8 L12 11 L15.3 13.8" />
    </Icon>
  );
}

export default Export;

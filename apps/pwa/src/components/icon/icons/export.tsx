import Icon, { IconProps } from '../base';

function Export(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M12 4 V14" />
      <path d="M8.5 10.5 L12 14 L15.5 10.5" />
      <path d="M5 16.5 V18 A2 2 0 0 0 7 20 H17 A2 2 0 0 0 19 18 V16.5" />
    </Icon>
  );
}

export default Export;

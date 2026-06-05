import Icon, { IconProps } from '../base';

function IconExport(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M6 3 H14.5 L20 8.5 V19 A2 2 0 0 1 18 21 H6 A2 2 0 0 1 4 19 V5 A2 2 0 0 1 6 3 Z" />
      <path d="M14.5 3 V8.5 H20" />
      <path d="M12 17 V11" />
      <path d="M8.5 14 L12 11 L15.5 14" />
    </Icon>
  );
}

export default IconExport;

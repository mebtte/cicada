import Icon, { IconProps } from '../base';

function PhotoAdd(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <rect x="4" y="5" width="16" height="13" rx="2.5" />
      <path d="M5.5 16 L9.5 12.2 L12 14.5 L14 12.4 L18.8 16" />
      <path d="M17 4 V9" />
      <path d="M14.5 6.5 H19.5" />
    </Icon>
  );
}

export default PhotoAdd;

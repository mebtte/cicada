import Icon, { IconProps } from '../base';

function IconExternalLink(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M15 5 H20 V10" />
      <path d="M20 5 L13 12" />
      <path d="M10 6 H7 A3 3 0 0 0 4 9 V17 A3 3 0 0 0 7 20 H15 A3 3 0 0 0 18 17 V14" />
    </Icon>
  );
}

export default IconExternalLink;

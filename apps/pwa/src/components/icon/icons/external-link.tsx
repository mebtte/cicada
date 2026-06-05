import Icon, { IconProps } from '../base';

function ExternalLink(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M14 4 H20 V10" />
      <path d="M20 4 L12.5 11.5" />
      <path d="M10 5.5 H7 A3 3 0 0 0 4 8.5 V17 A3 3 0 0 0 7 20 H15.5 A3 3 0 0 0 18.5 17 V14" />
    </Icon>
  );
}

export default ExternalLink;

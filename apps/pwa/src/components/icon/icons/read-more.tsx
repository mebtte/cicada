import Icon, { IconProps } from '../base';

function ReadMore(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <line x1="4" y1="7"  x2="13" y2="7"  />
      <line x1="4" y1="12" x2="13" y2="12" />
      <line x1="4" y1="17" x2="13" y2="17" />
      <polyline points="16 8 20 12 16 16" />
    </Icon>
  );
}

export default ReadMore;

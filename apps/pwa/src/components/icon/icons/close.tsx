import Icon, { IconProps } from '../base';

function Close(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </Icon>
  );
}

export default Close;

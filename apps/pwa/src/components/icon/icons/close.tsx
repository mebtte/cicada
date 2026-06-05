import Icon, { IconProps } from '../base';

function IconClose(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M8 8 Q12 11 16 16" />
      <path d="M16 8 Q12 13 8 16" />
    </Icon>
  );
}

export default IconClose;

import Icon, { IconProps } from '../base';

function Restart(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M18.2 8 A7 7 0 1 1 12 5" />
      <path d="M13.5 4 L18.5 7.8 L14.4 12" />
      <path d="M12 9 V13 L15 15" />
    </Icon>
  );
}

export default Restart;

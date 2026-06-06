import Icon, { IconProps } from '../base';

function Timer(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M9 4 H15" />
      <path d="M12 4 V6" />
      <circle cx="12" cy="13" r="7.2" />
      <path d="M12 9.2 V13 L15 15" />
    </Icon>
  );
}

export default Timer;

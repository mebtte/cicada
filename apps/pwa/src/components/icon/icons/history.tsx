import Icon, { IconProps } from '../base';

function History(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M5 7.3 V4.5 H8" />
      <path d="M5.3 7.2 A8 8 0 1 1 4.5 13" />
      <path d="M12 8 V12.4 L15.3 14.3" />
    </Icon>
  );
}

export default History;

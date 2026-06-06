import Icon, { IconProps } from '../base';

function Delete(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <line x1="4" y1="7" x2="20" y2="7" />
      <path d="M9 7 V5.5 A1.5 1.5 0 0 1 10.5 4 H13.5 A1.5 1.5 0 0 1 15 5.5 V7" />
      <path d="M6.5 7 L7.5 18.5 A2 2 0 0 0 9.5 20 H14.5 A2 2 0 0 0 16.5 18.5 L17.5 7" />
      <line x1="10" y1="11" x2="10" y2="16.5" />
      <line x1="14" y1="11" x2="14" y2="16.5" />
    </Icon>
  );
}

export default Delete;

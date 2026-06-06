import Icon, { IconProps } from '../base';

function Refresh(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M4.5 12.5 A7.5 7.5 0 0 1 17 7" />
      <path d="M12 4 L18.5 7 L13.5 11.5 Z" fill="currentColor" stroke="none" />
      <path d="M19.5 11.5 A7.5 7.5 0 0 1 7 17" />
      <path d="M12 20 L5.5 17 L10.5 12.5 Z" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export default Refresh;

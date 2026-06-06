import Icon, { IconProps } from '../base';

function Explore(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M14.8 8.2 L13.2 13.2 L8.2 14.8 L9.8 9.8 Z" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="#fff" stroke="none" />
    </Icon>
  );
}

export default Explore;

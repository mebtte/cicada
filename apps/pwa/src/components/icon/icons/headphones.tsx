import Icon, { IconProps } from '../base';

function Headphones(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M5 13 A7 7 0 0 1 19 13" />
      <rect x="4" y="12.5" width="4" height="6.5" rx="1.7" fill="currentColor" stroke="none" />
      <rect x="16" y="12.5" width="4" height="6.5" rx="1.7" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export default Headphones;

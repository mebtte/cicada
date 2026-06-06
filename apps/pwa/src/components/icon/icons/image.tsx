import Icon, { IconProps } from '../base';

function Image(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <rect x="4" y="5" width="16" height="14" rx="2.5" />
      <circle cx="8.6" cy="9.2" r="1.3" fill="currentColor" stroke="none" />
      <path d="M5.5 17 L10 12.5 L13 15.3 L15 13 L19 17" />
    </Icon>
  );
}

export default Image;

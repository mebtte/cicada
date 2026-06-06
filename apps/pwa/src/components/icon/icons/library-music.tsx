import Icon, { IconProps } from '../base';

function LibraryMusic(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M5 6.5 H3.8 A1.8 1.8 0 0 0 2 8.3 V17" />
      <rect x="6" y="4" width="16" height="16" rx="2.5" />
      <ellipse cx="12" cy="15.5" rx="2.7" ry="2" transform="rotate(-16 12 15.5)" fill="currentColor" />
      <path d="M14 15 V8.5 L18 9.7" />
    </Icon>
  );
}

export default LibraryMusic;

import Icon, { IconProps } from '../base';

function MusicNote(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <ellipse
        cx="8.6"
        cy="17.2"
        rx="2.8"
        ry="2.1"
        transform="rotate(-18 8.6 17.2)"
        fill="currentColor"
        stroke="none"
      />
      <path d="M11.2 16.4 V5.3" />
      <path d="M11.2 5.3 C14.1 5.8 17.2 7.2 18 9.7 C16.4 8.7 13.8 8.5 11.2 8.9" />
    </Icon>
  );
}

export default MusicNote;

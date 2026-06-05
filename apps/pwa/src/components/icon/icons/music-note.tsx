import Icon, { IconProps } from '../base';

function MusicNote(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <ellipse
        cx="9"
        cy="17"
        rx="3.8"
        ry="2.9"
        transform="rotate(-18 9 17)"
        fill="currentColor"
      />
      <path d="M12 16 L12 5" />
      <path
        d="M12 5 C15 5.8 19 8 19 11.5 C17.5 9.7 14.5 9.2 12 9.2 Z"
        fill="currentColor"
      />
    </Icon>
  );
}

export default MusicNote;

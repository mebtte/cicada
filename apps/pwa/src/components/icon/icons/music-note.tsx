import Icon, { IconProps } from '../base';

function IconMusicNote(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <ellipse
        cx="9.5"
        cy="17.5"
        rx="3.2"
        ry="2.5"
        transform="rotate(-18 9.5 17.5)"
        fill="currentColor"
      />
      <path d="M12 16.5 L12 6" />
      <path
        d="M12 6 C14.5 7 17 9 17 11.8 C16 10.3 14 9.8 12 9.8 Z"
        fill="currentColor"
      />
    </Icon>
  );
}

export default IconMusicNote;

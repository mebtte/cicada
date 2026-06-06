import Icon, { IconProps } from '../base';

function MusicNotes(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <ellipse cx="7.8" cy="17.2" rx="2.4" ry="1.8" transform="rotate(-18 7.8 17.2)" fill="currentColor" stroke="none" />
      <ellipse cx="16.2" cy="15.4" rx="2.4" ry="1.8" transform="rotate(-18 16.2 15.4)" fill="currentColor" stroke="none" />
      <path d="M9.9 16.4 V6.2 L18.1 4.7 V14.5" />
      <path d="M9.9 8.8 L18.1 7.3" />
    </Icon>
  );
}

export default MusicNotes;

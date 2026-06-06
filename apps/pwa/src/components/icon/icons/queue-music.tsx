import Icon, { IconProps } from '../base';

function QueueMusic(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M4 7 H14" />
      <path d="M4 12 H13" />
      <path d="M4 17 H9" />
      <ellipse cx="16.2" cy="17.2" rx="2.7" ry="2" transform="rotate(-18 16.2 17.2)" fill="currentColor" />
      <path d="M18 16.5 V8.5 L21 9.5" />
    </Icon>
  );
}

export default QueueMusic;

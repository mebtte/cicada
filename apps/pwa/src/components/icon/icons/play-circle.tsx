import Icon, { IconProps } from '../base';

function PlayCircle(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path
        d="M10 9 C10 8.4 10.6 8.1 11.1 8.4 L15.6 11.1 C16.3 11.5 16.3 12.5 15.6 12.9 L11.1 15.6 C10.6 15.9 10 15.6 10 15 Z"
        fill="currentColor"
        stroke="none"
      />
    </Icon>
  );
}

export default PlayCircle;

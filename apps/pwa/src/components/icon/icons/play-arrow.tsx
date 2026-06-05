import Icon, { IconProps } from '../base';

function PlayArrow(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path
        d="M5.5 4.5 C5.5 3.7 6.4 3.3 7.2 3.8 L19.2 11 C20.2 11.6 20.2 12.4 19.2 13 L7.2 20.2 C6.4 20.7 5.5 20.3 5.5 19.5 Z"
        fill="currentColor"
      />
    </Icon>
  );
}

export default PlayArrow;

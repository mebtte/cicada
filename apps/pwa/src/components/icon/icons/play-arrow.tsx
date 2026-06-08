import Icon, { IconProps } from '../base';

function PlayArrow(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path
        d="M8.2 7.2 C8.2 6.3 9.1 5.8 9.9 6.3 L17 10.6 C18.2 11.3 18.2 12.7 17 13.4 L9.9 17.7 C9.1 18.2 8.2 17.7 8.2 16.8 Z"
        fill="currentColor"
        stroke="none"
      />
    </Icon>
  );
}

export default PlayArrow;

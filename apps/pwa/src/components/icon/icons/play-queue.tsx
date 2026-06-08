import Icon, { IconProps } from '../base';

function PlayQueue(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path
        d="M4 4.5 C4 3.8 4.7 3.4 5.3 3.7 L9 6.3 C9.7 6.7 9.7 7.7 9 8.1 L5.3 10.7 C4.7 11 4 10.6 4 9.9 Z"
        fill="currentColor"
      />
      <line x1="12.5" y1="7"    x2="20"   y2="7"    />
      <line x1="4"    y1="13"   x2="18"   y2="13"   />
      <line x1="4"    y1="18.5" x2="19.5" y2="18.5" />
    </Icon>
  );
}

export default PlayQueue;

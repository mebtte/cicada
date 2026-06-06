import Icon, { IconProps } from '../base';

function SkipNext(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path
        d="M6.7 7.4 C6.7 6.6 7.6 6.1 8.3 6.6 L14.7 10.7 C15.8 11.4 15.8 12.6 14.7 13.3 L8.3 17.4 C7.6 17.9 6.7 17.4 6.7 16.6 Z"
        fill="currentColor"
        stroke="none"
      />
      <rect x="16.2" y="6.8" width="3.1" height="10.4" rx="1.55" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export default SkipNext;

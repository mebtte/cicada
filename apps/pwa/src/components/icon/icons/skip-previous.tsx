import Icon, { IconProps } from '../base';

function SkipPrevious(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path
        d="M17.3 7.4 C17.3 6.6 16.4 6.1 15.7 6.6 L9.3 10.7 C8.2 11.4 8.2 12.6 9.3 13.3 L15.7 17.4 C16.4 17.9 17.3 17.4 17.3 16.6 Z"
        fill="currentColor"
        stroke="none"
      />
      <rect x="4.7" y="6.8" width="3.1" height="10.4" rx="1.55" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export default SkipPrevious;

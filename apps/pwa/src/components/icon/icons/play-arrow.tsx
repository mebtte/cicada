import Icon, { IconProps } from '../base';

function IconPlayArrow(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path
        d="M8.5 5.8 C8.5 5 9.3 4.6 10 5 L18.5 10.7 C19.4 11.3 19.4 12.7 18.5 13.3 L10 19 C9.3 19.4 8.5 19 8.5 18.2 Z"
        fill="currentColor"
      />
    </Icon>
  );
}

export default IconPlayArrow;

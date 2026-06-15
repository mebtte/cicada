import Icon, { IconProps } from '../base';

function PersonStar(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="9.2" cy="8.4" r="3" />
      <path d="M4.3 19 C5.2 15.8 6.9 14.1 9.2 14.1 C11.2 14.1 12.8 15.3 13.7 17.6" />
      <path
        d="M18 3.2 L19.1 5.4 L21.5 5.7 L19.8 7.4 L20.2 9.8 L18 8.6 L15.8 9.8 L16.2 7.4 L14.5 5.7 L16.9 5.4 Z"
        fill="currentColor"
        stroke="none"
      />
    </Icon>
  );
}

export default PersonStar;

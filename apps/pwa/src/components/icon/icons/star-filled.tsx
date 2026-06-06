import Icon, { IconProps } from '../base';

function StarFilled(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path
        d="M12 4.2 L14.5 9 L19.7 9.7 L15.9 13.4 L16.8 18.8 L12 16.2 L7.2 18.8 L8.1 13.4 L4.3 9.7 L9.5 9 Z"
        fill="currentColor"
      />
    </Icon>
  );
}

export default StarFilled;

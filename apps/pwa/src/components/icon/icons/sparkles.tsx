import Icon, { IconProps } from '../base';

function Sparkles(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M12 3.8 L13.7 8.3 L18.2 10 L13.7 11.7 L12 16.2 L10.3 11.7 L5.8 10 L10.3 8.3 Z" fill="currentColor" />
      <path d="M18.5 14 L19.3 16 L21 16.8 L19.3 17.5 L18.5 19.5 L17.7 17.5 L16 16.8 L17.7 16 Z" />
      <path d="M5.5 15.2 L6.2 16.8 L7.8 17.5 L6.2 18.2 L5.5 19.8 L4.8 18.2 L3.2 17.5 L4.8 16.8 Z" />
    </Icon>
  );
}

export default Sparkles;

import Icon, { IconProps } from '../base';

function CloudOff(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M7.4 17.5 H17.1 A4 4 0 0 0 18.7 9.8 A6 6 0 0 0 8.2 7.7 A4.7 4.7 0 0 0 5.6 16.1" />
      <path d="M4.5 4.5 L19.5 19.5" />
    </Icon>
  );
}

export default CloudOff;

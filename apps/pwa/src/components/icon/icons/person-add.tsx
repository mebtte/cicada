import Icon, { IconProps } from '../base';

function PersonAdd(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="9.2" cy="8.4" r="3" />
      <path d="M4.3 19 C5.2 15.8 6.9 14.1 9.2 14.1 C11.2 14.1 12.8 15.3 13.7 17.6" />
      <path d="M18 12.5 V19.5" />
      <path d="M14.5 16 H21.5" />
    </Icon>
  );
}

export default PersonAdd;

import Icon, { IconProps } from '../base';

function PersonAdd(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="9.5" cy="8" r="3.2" fill="currentColor" stroke="none" />
      <path d="M4.5 18 C5.4 15 7.4 13.5 9.5 13.5 C11.5 13.5 13.3 14.9 14.2 17.4" />
      <path d="M18 11.5 V18.5" />
      <path d="M14.5 15 H21.5" />
    </Icon>
  );
}

export default PersonAdd;

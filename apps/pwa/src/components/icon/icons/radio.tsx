import Icon, { IconProps } from '../base';

function Radio(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M5 9 L18 4.5" />
      <rect x="3.2" y="9" width="17.6" height="11.2" rx="2" />
      <circle cx="15.5" cy="14.6" r="2.6" fill="currentColor" stroke="none" />
      <path d="M6.5 13 H10.5 M6.5 16.6 H10.5" />
    </Icon>
  );
}

export default Radio;

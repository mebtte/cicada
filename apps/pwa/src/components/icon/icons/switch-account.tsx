import Icon, { IconProps } from '../base';

function SwitchAccount(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8.5" r="2.8" fill="currentColor" stroke="none" />
      <path d="M4.5 18 C5.3 15.4 7.1 14 9 14 C10.6 14 12 14.9 12.9 16.6" />
      <path d="M16.5 6.5 H20 V10" />
      <path d="M20 6.5 L15.8 10.7" />
      <path d="M19.5 16.8 H16 V13.3" />
      <path d="M16 16.8 L20.2 12.6" />
    </Icon>
  );
}

export default SwitchAccount;

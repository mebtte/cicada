import Icon, { IconProps } from '../base';

function SwitchAccount(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="8.5" cy="8.3" r="2.9" />
      <path d="M3.8 18.5 C4.7 15.5 6.4 14 8.5 14 C10.2 14 11.5 14.8 12.4 16.3" />
      <path d="M15 7 H20" />
      <path d="M17.6 4.6 L20 7 L17.6 9.4" />
      <path d="M20 16.5 H15" />
      <path d="M17.4 14.1 L15 16.5 L17.4 18.9" />
    </Icon>
  );
}

export default SwitchAccount;

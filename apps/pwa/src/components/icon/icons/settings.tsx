import Icon, { IconProps } from '../base';

function Settings(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 4.5 V6.2" />
      <path d="M12 17.8 V19.5" />
      <path d="M4.5 12 H6.2" />
      <path d="M17.8 12 H19.5" />
      <path d="M6.7 6.7 L7.9 7.9" />
      <path d="M16.1 16.1 L17.3 17.3" />
      <path d="M17.3 6.7 L16.1 7.9" />
      <path d="M7.9 16.1 L6.7 17.3" />
    </Icon>
  );
}

export default Settings;

import Icon, { IconProps } from '../base';

function AdminPanel(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M12 3.5 L19 6.5 V11.2 C19 15.6 16.2 18.8 12 20.5 C7.8 18.8 5 15.6 5 11.2 V6.5 Z" />
      <circle cx="12" cy="10.2" r="2.1" fill="currentColor" stroke="none" />
      <path d="M8.7 16 C9.4 14.4 10.5 13.7 12 13.7 C13.5 13.7 14.6 14.4 15.3 16" />
    </Icon>
  );
}

export default AdminPanel;

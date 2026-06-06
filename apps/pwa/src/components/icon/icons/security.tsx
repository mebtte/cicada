import Icon, { IconProps } from '../base';

function Security(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M12 3.5 L19 6.5 V11.2 C19 15.6 16.2 18.8 12 20.5 C7.8 18.8 5 15.6 5 11.2 V6.5 Z" />
      <path d="M8.8 12.2 L11.3 14.6 L16 9.7" />
    </Icon>
  );
}

export default Security;

import Icon, { IconProps } from '../base';

function Microphone(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <rect x="8.2" y="4" width="7.6" height="10" rx="3.8" fill="currentColor" stroke="none" />
      <path d="M5.5 11.5 A6.5 6.5 0 0 0 18.5 11.5" />
      <path d="M12 18 V21" />
      <path d="M8.5 21 H15.5" />
    </Icon>
  );
}

export default Microphone;

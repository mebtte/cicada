import Icon, { IconProps } from '../base';

function Devices(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <rect x="4" y="5" width="12" height="9" rx="2" />
      <path d="M8 18 H14" />
      <path d="M10 14 V18" />
      <rect x="15" y="10" width="5" height="10" rx="1.7" />
      <circle cx="17.5" cy="17.3" r="0.6" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export default Devices;

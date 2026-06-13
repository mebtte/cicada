import Icon, { IconProps } from '../base';

function Locate(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M12 5 V12.8" />
      <path d="M7.5 9.5 L12 14 L16.5 9.5" />
      <circle cx="12" cy="19" r="2.4" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export default Locate;

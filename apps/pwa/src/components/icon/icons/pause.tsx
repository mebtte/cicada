import Icon, { IconProps } from '../base';

function Pause(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <rect x="7" y="6.2" width="3.8" height="11.6" rx="1.9" fill="currentColor" stroke="none" />
      <rect x="13.2" y="6.2" width="3.8" height="11.6" rx="1.9" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export default Pause;

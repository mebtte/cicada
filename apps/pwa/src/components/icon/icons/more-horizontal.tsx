import Icon, { IconProps } from '../base';

function MoreHorizontal(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="6" cy="12" r="1.7" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r="1.7" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export default MoreHorizontal;

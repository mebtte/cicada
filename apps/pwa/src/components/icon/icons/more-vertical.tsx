import Icon, { IconProps } from '../base';

function MoreVertical(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="6" r="1.7" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none" />
      <circle cx="12" cy="18" r="1.7" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export default MoreVertical;

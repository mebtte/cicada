import Icon, { IconProps } from '../base';

function DragIndicator(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="9"  cy="6"  r="1.4" fill="currentColor" stroke="none" />
      <circle cx="9"  cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="9"  cy="18" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="15" cy="6"  r="1.4" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="15" cy="18" r="1.4" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export default DragIndicator;

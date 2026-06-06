import Icon, { IconProps } from '../base';

function AddBox(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <rect x="4.5" y="4.5" width="15" height="15" rx="2.5" />
      <line x1="12" y1="9"  x2="12" y2="15" />
      <line x1="9"  y1="12" x2="15" y2="12" />
    </Icon>
  );
}

export default AddBox;

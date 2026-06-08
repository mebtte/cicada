import Icon, { IconProps } from '../base';

function Expand(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M10 10 L5 5" />
      <path d="M5 5 H9" />
      <path d="M5 5 V9" />
      <path d="M14 14 L19 19" />
      <path d="M19 19 H15" />
      <path d="M19 19 V15" />
    </Icon>
  );
}

export default Expand;

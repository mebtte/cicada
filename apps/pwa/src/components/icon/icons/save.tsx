import Icon, { IconProps } from '../base';

function Save(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M5 4 H16 L19 7 V20 H5 Z" />
      <path d="M8 4 V10 H15 V4" />
      <path d="M8 20 V15 H16 V20" />
    </Icon>
  );
}

export default Save;

import Icon, { IconProps } from '../base';

function CloudUpload(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M7 18 H17.2 A4.2 4.2 0 0 0 18.7 9.9 A6 6 0 0 0 7.6 8 A4.7 4.7 0 0 0 7 18 Z" />
      <path d="M12 16 V10" />
      <path d="M8.8 12.6 L12 10 L15.2 12.6" />
    </Icon>
  );
}

export default CloudUpload;

import Icon, { IconProps } from '../base';

function OfflineDownload(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5 V14.2" />
      <path d="M8.8 11.6 L12 14.8 L15.2 11.6" />
      <path d="M8.5 17 H15.5" />
    </Icon>
  );
}

export default OfflineDownload;

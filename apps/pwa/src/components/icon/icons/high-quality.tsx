import Icon, { IconProps } from '../base';

function HighQuality(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M12 4.2 L19 8.3 V16.3 L12 20.5 L5 16.3 V8.3 Z" />
      <path d="M8.5 13.8 V9.3" />
      <path d="M8.5 11.5 H11.2" />
      <path d="M11.2 13.8 V9.3" />
      <path d="M14.2 9.3 A2.2 2.2 0 0 1 16.4 11.5 V13.8" />
      <path d="M15.4 14.2 L16.8 15.6" />
    </Icon>
  );
}

export default HighQuality;

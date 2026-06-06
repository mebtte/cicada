import Icon, { IconProps } from '../base';

function QueueInsert(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <line x1="5" y1="6"  x2="19" y2="6"  />
      <line x1="5" y1="18" x2="19" y2="18" />
      <line x1="5" y1="12" x2="10" y2="12" />
      <line x1="14" y1="12" x2="20" y2="12" />
      <polyline points="16 9 13 12 16 15" />
    </Icon>
  );
}

export default QueueInsert;

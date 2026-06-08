import Icon, { IconProps } from '../base';

function PostAdd(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M4 4 H13 L17 8 V14" />
      <path d="M4 4 V20 H13" />
      <path d="M13 4 V8 H17" />
      <line x1="7" y1="11.5" x2="13.5" y2="11.5" />
      <line x1="7" y1="15"   x2="10.5" y2="15"   />
      <line x1="17" y1="16"   x2="17" y2="20"   />
      <line x1="15" y1="18"   x2="19" y2="18"   />
    </Icon>
  );
}

export default PostAdd;

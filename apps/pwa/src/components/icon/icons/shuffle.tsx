import Icon, { IconProps } from '../base';

function Shuffle(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M4 7 H7.5 C10.5 7 12 17 15.5 17 H19" />
      <path d="M16 14 L19 17 L16 20" />
      <path d="M4 17 H7.5 C9 17 10.1 14.8 11.1 12.5" />
      <path d="M13.2 8.7 C14 7.7 14.8 7 15.8 7 H19" />
      <path d="M16 4 L19 7 L16 10" />
    </Icon>
  );
}

export default Shuffle;

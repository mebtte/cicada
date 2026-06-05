import Icon, { IconProps } from '../base';

function Edit(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <path d="M4 20.3 L8.7 19.3 L19 9 L15 5 L4.7 15.3 Z" />
      <path d="M13.5 6.5 L17.5 10.5" />
      <path d="M15 5 L16.5 3.5 A2.2 2.2 0 0 1 19.7 3.5 L20.5 4.3 A2.2 2.2 0 0 1 20.5 7.5 L19 9" />
      <circle cx="6.2" cy="18.4" r="0.9" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export default Edit;

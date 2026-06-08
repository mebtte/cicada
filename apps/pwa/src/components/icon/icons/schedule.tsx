import Icon, { IconProps } from '../base';

function Schedule(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5 V12.4 L15.6 14.5" />
    </Icon>
  );
}

export default Schedule;

import Icon, { IconProps } from '../base';

function Dashboard(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      <rect x="4" y="4.5" width="7" height="7" rx="2" />
      <rect x="13" y="4.5" width="7" height="5" rx="1.7" />
      <rect x="4" y="13.5" width="7" height="6" rx="1.7" />
      <rect x="13" y="11.5" width="7" height="8" rx="2" />
    </Icon>
  );
}

export default Dashboard;

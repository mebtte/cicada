import Icon, { IconProps } from '../base';

function People(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      {/* 整体相对 viewBox 中心 (12,12) 放大 ~1.1, 让两人主体的视觉体量与其他图标对齐 */}
      <circle cx="9.3" cy="8.2" r="3.3" />
      <path d="M3.8 19.7 C4.8 16 6.6 14.2 9.3 14.2 C11.9 14.2 13.8 16 14.8 19.7" />
      <path d="M15.7 5.8 C17.4 6.2 18.6 7.5 18.6 9.3 C18.6 10.9 17.5 12.2 15.9 12.7" />
      <path d="M16.2 15 C18.3 15.5 19.8 17 20.6 19.7" />
    </Icon>
  );
}

export default People;

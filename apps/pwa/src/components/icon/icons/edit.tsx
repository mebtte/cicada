import Icon, { IconProps } from '../base';

function Edit(props: Omit<IconProps, 'children'>) {
  return (
    <Icon {...props}>
      {/* 整体相对 viewBox 中心 (12,12) 缩放 ~0.9, 让铅笔对角分布的视觉体量与其他图标对齐 */}
      <path d="M4.8 19.5 L9 18.6 L18.3 9.3 L14.7 5.7 L5.4 15 Z" />
      <path d="M13.4 7 L17 10.7" />
      <path d="M14.7 5.7 L16 4.4 A2 2 0 0 1 18.9 4.4 L19.7 4.9 A2 2 0 0 1 19.7 8 L18.3 9.3" />
      <circle cx="6.8" cy="17.8" r="0.8" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export default Edit;

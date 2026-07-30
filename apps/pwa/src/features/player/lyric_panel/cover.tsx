import { CSSVariable } from '@/global_style';
import ImageFrame from '@/components/image_frame';
import { CoverFallback } from '@/components/cover';

// 纯音乐/无歌词时展示的大封面. 复用 ImageFrame(头像同款): 2px 中性边框 + 硬底投影,
// 阴影风格与头像一致, 契合全站扁平设计语言.
const SIZE = 'min(70vw, 320px)';
const RADIUS = 18;
// 大封面尺度比头像大, 底部硬投影相应加深一点保持比例
const SHADOW_OFFSET = 6;

function Cover({ cover }: { cover: string }) {
  return (
    <ImageFrame
      src={cover}
      size={SIZE}
      radius={RADIUS}
      shadowOffset={SHADOW_OFFSET}
      borderColor={CSSVariable.COLOR_NEUTRAL_SHADOW}
      shadowColor={CSSVariable.COLOR_NEUTRAL_SHADOW}
      fallbackVariant={CoverFallback.MUSIC}
    />
  );
}

export default Cover;

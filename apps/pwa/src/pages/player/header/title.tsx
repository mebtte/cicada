import styled from 'styled-components';
import { useTransition, animated } from 'react-spring';
import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';

const Style = styled.div`
  flex: 1;
  min-width: 0;
  position: relative;
`;
const AnimatedDiv = styled(animated.div)`
  position: absolute;
  width: 100%;
  top: 0;
  left: 0;

  font-size: 18px;
  font-weight: 550;
  user-select: none;
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
  ${ellipsis}
`;

function Title({ title }: { title: string }) {
  const transitions = useTransition(title, {
    from: { opacity: 0, transform: 'translate(0, -150%)' },
    enter: { opacity: 1, transform: 'translate(0, -50%)' },
    leave: { opacity: 0, transform: 'translate(0, 50%)' },
  });
  return (
    <Style>
      {transitions((style, t) => (
        <AnimatedDiv style={style}>{t}</AnimatedDiv>
      ))}
    </Style>
  );
}

export default Title;

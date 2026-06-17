import styled from 'styled-components';
import { useTransition, animated } from '@react-spring/web';
import { CSSVariable } from '@/global_style';
import ellipsis from '@/style/ellipsis';

const Style = styled.div`
  flex: 1;
  min-width: 0;
  align-self: stretch;
  position: relative;
`;
const AnimatedDiv = styled(animated.div)`
  position: absolute;
  width: 100%;
  top: 50%;
  left: 0;

  font-family: 'Nunito', 'Varela Round', system-ui, sans-serif;
  user-select: none;
  color: ${CSSVariable.TEXT_COLOR_PRIMARY};
`;
const MainTitle = styled.div`
  ${ellipsis}

  font-size: 21px;
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: 0.2px;
  color: rgb(75 75 75);
`;
const Description = styled.div`
  ${ellipsis}

  margin-top: 4px;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: 0.1px;
  color: rgb(150 150 150);
`;

interface TitleItem {
  title: string;
  description?: string;
}

function Title({ title, description }: TitleItem) {
  const item: TitleItem = { title, description };
  const transitions = useTransition(item, {
    keys: ({ title: t, description: d }) => `${t}\n${d ?? ''}`,
    from: { opacity: 0, transform: 'translate(0, -150%)' },
    enter: { opacity: 1, transform: 'translate(0, -50%)' },
    leave: { opacity: 0, transform: 'translate(0, 50%)' },
  });
  return (
    <Style>
      {transitions((style, t) => (
        <AnimatedDiv style={style}>
          <MainTitle>{t.title}</MainTitle>
          {t.description ? <Description>{t.description}</Description> : null}
        </AnimatedDiv>
      ))}
    </Style>
  );
}

export default Title;

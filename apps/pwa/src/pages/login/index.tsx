import { useRef, useState } from 'react';
import { animated, useTransition } from 'react-spring';
import styled from 'styled-components';
import PageContainer from '@/components/page_container';
import FirstStep from './first_step';
import SecondStep from './second_step';
import { Step } from './constants';
import AppRegion from './app_region';
import ManagePage from './manage_page';

const Style = styled(PageContainer)`
  overflow: hidden;
`;
const AnimatedDiv = styled(animated.div)`
  position: absolute;
  top: 50%;
  left: 50%;

  width: 320px;
  padding: 30px 20px;
`;

function Login() {
  const [step, setStep] = useState(Step.FIRST);
  const [showManagePage, setShowManagePage] = useState(false);
  const directionRef = useRef<1 | -1>(1);

  const toNext = () => {
    directionRef.current = 1;
    setStep(Step.SECOND);
  };

  const toPrevious = () => {
    directionRef.current = -1;
    setStep(Step.FIRST);
  };

  const transitions = useTransition(step, {
    from: {
      opacity: 0,
      transform: directionRef.current === 1
        ? 'translate(50%, -50%)'
        : 'translate(-150%, -50%)',
    },
    enter: { opacity: 1, transform: 'translate(-50%, -50%)' },
    leave: {
      opacity: 0,
      transform: directionRef.current === 1
        ? 'translate(-150%, -50%)'
        : 'translate(50%, -50%)',
    },
  });
  return (
    <Style>
      {transitions((style, s) => {
        switch (s) {
          case Step.FIRST: {
            return (
              <AnimatedDiv style={style}>
                <FirstStep
                  toNext={toNext}
                  onManage={() => setShowManagePage(true)}
                />
              </AnimatedDiv>
            );
          }
          case Step.SECOND: {
            return (
              <AnimatedDiv style={style}>
                <SecondStep toPrevious={toPrevious} />
              </AnimatedDiv>
            );
          }
          default: {
            return null;
          }
        }
      })}
      {showManagePage && (
        <ManagePage onClose={() => setShowManagePage(false)} />
      )}
      <AppRegion />
    </Style>
  );
}

export default Login;

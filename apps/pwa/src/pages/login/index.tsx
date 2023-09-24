import { useState } from 'react';
import { animated, useTransition } from 'react-spring';
import styled from 'styled-components';
import PageContainer from '@/components/page_container';
import FirstStep from './first_step';
import SecondStep from './second_step';
import { Step } from './constants';

const Style = styled(PageContainer)`
  -webkit-app-region: drag;
`;

function Login() {
  const [step, setStep] = useState(Step.FIRST);

  const transitions = useTransition(step, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
  });
  return (
    <Style>
      {transitions((style, s) => {
        switch (s) {
          case Step.FIRST: {
            return (
              <animated.div style={style}>
                <FirstStep toNext={() => setStep(Step.SECOND)} />
              </animated.div>
            );
          }
          case Step.SECOND: {
            return (
              <animated.div style={style}>
                <SecondStep toPrevious={() => setStep(Step.FIRST)} />
              </animated.div>
            );
          }
          default: {
            return null;
          }
        }
      })}
    </Style>
  );
}

export default Login;

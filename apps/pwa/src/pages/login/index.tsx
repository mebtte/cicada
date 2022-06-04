import styled, { css } from 'styled-components';
import { useEffect, useState } from 'react';
import storage, { Key } from '@/platform/storage';
import u from '@/global_state/user';
import EmailPanel from './email_panel';
import LoginCodePanel from './login_code_panel';
import UserPanel from './user_panel';
import { Step, STEPS } from './constants';

const Style = styled.div<{ step: Step }>`
  min-height: 100vh;

  display: flex;
  align-items: center;
  justify-content: center;

  > .container {
    width: 90%;
    max-width: 350px;

    overflow: visible;
    touch-action: none;

    > .content {
      width: ${100 * STEPS.length}%;

      display: flex;
      align-items: center;

      transition: transform ease-in-out 300ms;
    }
  }

  ${({ step }) => css`
    > .container {
      > .content {
        transform: translateX(-${STEPS.indexOf(step) * (100 / STEPS.length)}%);
      }
    }
  `}
`;
const getInitialEmail = () => storage.getItem(Key.LAST_SIGNIN_EMAIL) || '';

function Login() {
  const user = u.useState();

  const [step, setStep] = useState(Step.FIRST);
  const [email, setEmail] = useState(getInitialEmail);

  useEffect(() => {
    if (user) {
      setStep(Step.THIRD);
    } else {
      setStep(Step.FIRST);
    }
  }, [user]);

  return (
    <Style step={step}>
      <div className="container">
        <div className="content">
          <EmailPanel
            visible={step === Step.FIRST}
            initialEmail={email}
            updateEmail={setEmail}
            toNext={() => setStep(Step.SECOND)}
          />
          <LoginCodePanel
            visible={step === Step.SECOND}
            email={email}
            toPrevious={() => setStep(Step.FIRST)}
            toNext={() => setStep(Step.THIRD)}
          />
          <UserPanel visible={step === Step.THIRD} />
        </div>
      </div>
    </Style>
  );
}

export default Login;

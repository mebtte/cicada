import { useCallback, useEffect, useRef, useState } from 'react';
import { animated, useTransition } from 'react-spring';
import styled from 'styled-components';
import PageContainer from '@/components/page_container';
import definition from '@/definition';
import { useSelectedServer } from '@/global_states/server';
import { CSSVariable } from '@/global_style';
import { t } from '@/i18n';
import FirstStep from './first_step';
import SecondStep from './second_step';
import { Step } from './constants';
import AppRegion from './app_region';
import ManagePage from './manage_page';

const Style = styled(PageContainer)`
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
`;
const Layout = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: max(30px, env(safe-area-inset-top, 30px)) 16px
    max(16px, env(safe-area-inset-bottom, 16px));
`;
const StageSlot = styled.div`
  flex: 1 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
`;
const Stage = styled.div`
  display: grid;
  align-items: center;
  justify-items: center;
  width: 100%;
`;
const AnimatedDiv = styled(animated.div)`
  grid-area: 1 / 1;
  width: 320px;
  max-width: 100%;
  padding: 30px 20px;
`;
const VersionFooter = styled.div`
  flex-shrink: 0;
  width: 100%;
  margin-top: 16px;
  font-size: ${CSSVariable.TEXT_SIZE_SMALL};
  color: ${CSSVariable.TEXT_COLOR_SECONDARY};
  text-align: center;
`;
const CENTER_TRANSFORM = 'translateX(0)';

function Login() {
  const [step, setStep] = useState(Step.FIRST);
  const [showManagePage, setShowManagePage] = useState(false);
  const [stageMinHeight, setStageMinHeight] = useState(0);
  const directionRef = useRef<1 | -1>(1);
  const resizeObserverMapRef = useRef(new Map<Step, ResizeObserver>());
  const selectedServer = useSelectedServer();

  const updateStageMinHeight = useCallback((height: number) => {
    setStageMinHeight((current) => Math.max(current, Math.ceil(height)));
  }, []);

  const setStepPanelRef = useCallback(
    (s: Step) => (node: HTMLDivElement | null) => {
      resizeObserverMapRef.current.get(s)?.disconnect();
      resizeObserverMapRef.current.delete(s);

      if (!node) return;

      updateStageMinHeight(node.offsetHeight);

      const resizeObserver = new ResizeObserver(() => {
        updateStageMinHeight(node.offsetHeight);
      });
      resizeObserver.observe(node);
      resizeObserverMapRef.current.set(s, resizeObserver);
    },
    [updateStageMinHeight],
  );

  useEffect(
    () => () => {
      resizeObserverMapRef.current.forEach((resizeObserver) =>
        resizeObserver.disconnect(),
      );
      resizeObserverMapRef.current.clear();
    },
    [],
  );

  const toNext = () => {
    directionRef.current = 1;
    setStep(Step.SECOND);
  };

  const toPrevious = () => {
    directionRef.current = -1;
    setStep(Step.FIRST);
  };

  const transitions = useTransition(step, {
    initial: {
      opacity: 1,
      transform: CENTER_TRANSFORM,
    },
    from: {
      opacity: 0,
      transform: directionRef.current === 1
        ? 'translateX(120%)'
        : 'translateX(-120%)',
    },
    enter: { opacity: 1, transform: CENTER_TRANSFORM },
    leave: {
      opacity: 0,
      transform: directionRef.current === 1
        ? 'translateX(-120%)'
        : 'translateX(120%)',
    },
  });
  return (
    <Style>
      <Layout>
        <StageSlot>
          <Stage style={{ minHeight: stageMinHeight }}>
            {transitions((style, s) => {
              switch (s) {
                case Step.FIRST: {
                  return (
                    <AnimatedDiv ref={setStepPanelRef(s)} style={style}>
                      <FirstStep
                        toNext={toNext}
                        onManage={() => setShowManagePage(true)}
                      />
                    </AnimatedDiv>
                  );
                }
                case Step.SECOND: {
                  return (
                    <AnimatedDiv ref={setStepPanelRef(s)} style={style}>
                      <SecondStep toPrevious={toPrevious} />
                    </AnimatedDiv>
                  );
                }
                default: {
                  return null;
                }
              }
            })}
          </Stage>
        </StageSlot>
        <VersionFooter>
          {t('pwa_version')}: {definition.VERSION}
          {step === Step.SECOND && selectedServer
            ? ` · ${t('server_version')}: ${selectedServer.version}`
            : ''}
        </VersionFooter>
      </Layout>
      {showManagePage && (
        <ManagePage onClose={() => setShowManagePage(false)} />
      )}
      <AppRegion />
    </Style>
  );
}

export default Login;

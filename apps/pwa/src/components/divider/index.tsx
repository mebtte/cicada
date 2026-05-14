import styled, { css } from 'styled-components';
import { CSSVariable } from '@/global_style';

const FONT = `'Nunito', 'Varela Round', system-ui, sans-serif`;

const lineBase = css`
  height: 2px;
  background-color: rgb(230 230 230);
  border-radius: 1px;
`;

const Plain = styled.div`
  ${lineBase}
`;

const WithLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  > .line {
    ${lineBase}
    flex: 1;
    min-width: 0;
  }

  > .label {
    font-family: ${FONT};
    font-size: 12px;
    font-weight: 800;
    color: ${CSSVariable.COLOR_CONTROL_NEUTRAL};
    text-transform: uppercase;
    letter-spacing: 0.06em;
    white-space: nowrap;
  }
`;

function Divider({ label }: { label?: string }) {
  if (label) {
    return (
      <WithLabel>
        <div className="line" />
        <span className="label">{label}</span>
        <div className="line" />
      </WithLabel>
    );
  }
  return <Plain />;
}

export default Divider;

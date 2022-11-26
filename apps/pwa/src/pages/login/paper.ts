import styled from 'styled-components';

const WIDTH = 320;

export default styled.div`
  position: absolute;
  left: calc(50% - ${WIDTH / 2}px);
  top: 50%;
  width: ${WIDTH}px;

  padding: 30px 20px;

  transform: translateY(-50%);
  box-shadow: 0px 2px 1px -1px rgb(0 0 0 / 12%),
    0px 1px 3px 0px rgb(0 0 0 / 12%);
`;

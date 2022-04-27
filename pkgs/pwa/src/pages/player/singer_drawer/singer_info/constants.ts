import styled from 'styled-components';

export const COVER_SIZE = 200;

export const Container = styled.div`
  position: relative;
  height: ${COVER_SIZE}px;

  margin: 20px;

  display: flex;
  align-items: center;
  > .info {
    flex: 1;
    min-width: 0;
    margin-right: 20px;
    > .name {
      font-size: 36px;
      color: rgb(55 55 55);
    }
    > .alias {
      font-size: 14px;
      margin-top: 10px;
      color: rgb(155 155 155);
    }
  }
`;

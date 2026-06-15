import styled from 'styled-components';

const ConsequenceList = styled.ul`
  margin: 0;
  padding-left: 1.2em;
  display: grid;
  gap: 6px;
  line-height: 1.5;

  > li::first-letter {
    text-transform: uppercase;
  }
`;

export default ConsequenceList;

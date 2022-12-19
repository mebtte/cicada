import { useEffect, useState } from 'react';
import styled from 'styled-components';
import JpgDefaultCover from './default_cover.jpeg';

const Style = styled.img`
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1.5;
  object-fit: cover;
  object-position: center;
`;

function Cover({ cover }: { cover: string }) {
  const [currentCover, setCurrentCover] = useState(cover);

  useEffect(() => {
    setCurrentCover(cover);
  }, [cover]);

  return (
    <Style
      src={currentCover}
      alt="cover"
      crossOrigin="anonymous"
      loading="lazy"
      onError={() => setCurrentCover(JpgDefaultCover)}
    />
  );
}

export default Cover;

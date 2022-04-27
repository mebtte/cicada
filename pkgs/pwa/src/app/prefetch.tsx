import React from 'react';
import { Helmet } from 'react-helmet';

import JpegDefaultAvatar from '@/components/avatar/default_avatar.jpeg';

const IMAGES: string[] = Array.from(
  new Set(['/logo.png', '/text_logo.png', JpegDefaultAvatar]),
);

const Prefetch = () => (
  <Helmet>
    {IMAGES.map((image) => (
      <link key={image} rel="prefetch" href={image} />
    ))}
  </Helmet>
);

export default React.memo(Prefetch);

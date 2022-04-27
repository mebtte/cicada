import { useState, useEffect } from 'react';

import loadImage from './load_image';
import logger from '../platform/logger';

export default (src: string, defaultImage: string) => {
  const [currentSrc, setCurrentSrc] = useState(defaultImage);

  useEffect(() => {
    if (src) {
      let canceled = false;
      loadImage(src)
        .then(() => {
          if (canceled) {
            return;
          }
          return setCurrentSrc(src);
        })
        .catch((error) => {
          if (canceled) {
            return;
          }
          logger.error(error, {
            description: '加载图片失败',
          });
          return setCurrentSrc(defaultImage);
        });
      return () => {
        canceled = true;
      };
    }
  }, [src, defaultImage]);

  return currentSrc;
};

import { useEffect } from 'react';

function useDocumentTitle(title: string) {
  useEffect(() => {
    const originalTitle = document.title;
    return () => {
      document.title = originalTitle;
    };
  }, []);

  useEffect(() => {
    document.title = title;
  }, [title]);
}

export default useDocumentTitle;

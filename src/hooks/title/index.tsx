import { useEffect } from 'react';

// interface TitleProps { title: string }

const useTitle = (title: string) => {
  useEffect(() => {
    const preTitle = document.title;
    document.title = title;
    return () => {
      document.title = preTitle;
    };
  }, [title]);
};

export default useTitle;

// export type { TitleProps };

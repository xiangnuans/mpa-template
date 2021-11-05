import './layout.module.less';

import React from 'react';
import { useTitle } from '@hooks/index';

interface LayoutProps {
  children: any
};

const Layout = (props: LayoutProps) => {
  useTitle('提分王');
  return (
    <div>Hello</div>
  );
};

export default Layout;

// 如果你导出的是type，会保证在编译去掉
export type { LayoutProps };

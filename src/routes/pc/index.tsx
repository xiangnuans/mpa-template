import { lazy } from 'react';

export const routerConfig = [
  {
    path: '/home',
    component: lazy(() => import('@containers/pc/home/home')),
    exact: true
  },
];

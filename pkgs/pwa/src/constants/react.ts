import React from 'react';

// 给React.memo封装的组件添加属性
export type CustomMemoExoticComponent<
  C extends React.ComponentType<any>,
  E
> = React.MemoExoticComponent<C> & E;

import React, { ReactNode } from 'react';

import logger from '@/platform/logger';

/**
 * 错误边界
 * @author mebtte<hi@mebtte.com>
 */
class ErrorBoundary extends React.PureComponent<
  React.PropsWithChildren<{
    /** 发生错误后的替补渲染方案 */
    fallback: (error: Error) => ReactNode;
    /** 错误回调 */
    onError?: (error: Error) => void;
  }>,
  {
    error: Error | null;
  }
> {
  static defaultProps = {
    onError: (error: Error) =>
      logger.error(error, {
        description: '渲染发生错误',
        report: true,
      }),
  };

  constructor(props) {
    super(props);
    this.state = {
      error: null,
    };
  }

  componentDidCatch(error: Error) {
    this.setState({ error });
    this.props.onError(error);
  }

  render() {
    const { error } = this.state;
    const { children, fallback } = this.props;
    if (error) {
      return fallback(error);
    }
    return children;
  }
}

export default ErrorBoundary;

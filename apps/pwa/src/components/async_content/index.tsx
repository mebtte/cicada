import { HTMLAttributes, ReactNode } from 'react';
import styled from 'styled-components';
import ErrorCard from '@/components/error_card';
import Spinner from '@/components/spinner';

const StateBox = styled.div`
  width: 100%;
  height: 100%;
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
`;

export interface AsyncContentProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  error?: Error | null;
  errorContent?: ReactNode;
  loading?: boolean;
  loadingContent?: ReactNode;
  retry?: () => void;
}

function AsyncContent({
  children,
  error,
  errorContent,
  loading = false,
  loadingContent,
  retry,
  ...props
}: AsyncContentProps) {
  if (loading) {
    return (
      <StateBox {...props}>
        {loadingContent ?? <Spinner />}
      </StateBox>
    );
  }

  if (error) {
    return (
      <StateBox {...props}>
        {errorContent ?? (
          <ErrorCard errorMessage={error.message} retry={retry ?? (() => {})} />
        )}
      </StateBox>
    );
  }

  return <>{children}</>;
}

export default AsyncContent;

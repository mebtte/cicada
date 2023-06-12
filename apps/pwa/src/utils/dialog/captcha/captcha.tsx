import { HtmlHTMLAttributes } from 'react';
import styled from 'styled-components';
import absoluteFullSize from '@/style/absolute_full_size';
import { flexCenter } from '@/style/flexbox';
import ErrorCard from '@/components/error_card';
import Spinner from '@/components/spinner';
import { CaptchaData } from './constants';

const Style = styled.div`
  > .content {
    position: relative;

    padding-bottom: 33.33%;

    > .loading {
      ${absoluteFullSize}
      ${flexCenter}
    }

    > .svg {
      ${absoluteFullSize}

      cursor: pointer;

      > svg {
        width: 100%;
        height: 100%;
      }
    }
  }
`;

function Captcha({
  captchaData,
  reload,
  ...props
}: {
  captchaData: CaptchaData;
  reload: () => void;
} & HtmlHTMLAttributes<HTMLDivElement>) {
  if (captchaData.error) {
    return (
      <ErrorCard
        errorMessage={captchaData.error.message}
        retry={reload}
        {...props}
      />
    );
  }
  return (
    <Style {...props}>
      <div className="content">
        {captchaData.loading ? (
          <div className="loading">
            <Spinner />
          </div>
        ) : (
          <div
            className="svg"
            onClick={reload}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: captchaData.data.svg,
            }}
          />
        )}
      </div>
    </Style>
  );
}

export default Captcha;

import { HtmlHTMLAttributes } from 'react';
import styled from 'styled-components';
import { flexCenter } from '@/style/flexbox';
import ErrorCard from '@/components/error_card';
import Spinner from '@/components/spinner';
import { CaptchaData } from './constants';

const Style = styled.div`
  width: 100%;
  border-radius: 10px;
  overflow: hidden;

  > .loading {
    aspect-ratio: 3 / 1;
    ${flexCenter}
    background: rgb(240 240 240);
  }

  > .svg {
    cursor: pointer;
    line-height: 0;

    > svg {
      display: block;
      width: 100%;
      height: auto;
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
      {captchaData.loading ? (
        <div className="loading">
          <Spinner />
        </div>
      ) : (
        <div
          className="svg"
          onClick={reload}
          dangerouslySetInnerHTML={{ __html: captchaData.data.svg }}
        />
      )}
    </Style>
  );
}

export default Captcha;

import { HtmlHTMLAttributes } from 'react';
import styled from 'styled-components';
import { flexCenter } from '@/style/flexbox';
import ErrorCard from '@/components/error_card';
import Spinner from '@/components/spinner';
import { t } from '@/i18n';
import { CaptchaData } from './constants';

const Style = styled.div`
  width: 100%;
  border-radius: 10px;
  overflow: hidden;

  > .loading,
  > .image {
    width: 100%;
    max-width: 240px;
    margin-inline: auto;
    aspect-ratio: 3 / 1;
    border-radius: 10px;
    overflow: hidden;
  }

  > .loading {
    ${flexCenter}
    background: rgb(240 240 240);
  }

  > .image {
    display: block;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
    line-height: 0;

    > img {
      display: block;
      width: 100%;
      height: auto;
      aspect-ratio: 3 / 1;
      object-fit: contain;
    }

    &:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: -2px;
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
        <button
          type="button"
          className="image"
          onClick={reload}
          aria-label={t('refresh_captcha')}
          title={t('refresh_captcha')}
        >
          <img src={captchaData.data.image} alt={t('captcha')} draggable={false} />
        </button>
      )}
    </Style>
  );
}

export default Captcha;

import styled from 'styled-components';
import { HTMLAttributes, ReactNode } from 'react';
import Cover from '@/components/cover';
import { Shape } from '@/components/cover/constants';

type Variant = 'record' | 'profile';

const Style = styled.div<{
  $accent: string;
  $shadow: string;
  $variant: Variant;
}>`
  position: relative;
  min-width: 0;
  padding: ${({ $variant }) =>
    $variant === 'profile' ? '4px 4px 7px' : '10px 10px 7px'};

  border: 2px solid ${({ $shadow }) => $shadow};
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 5px 0 ${({ $shadow }) => $shadow};

  cursor: pointer;
  transition:
    transform 150ms ease-out,
    box-shadow 150ms ease-out,
    border-color 150ms ease-out,
    filter 120ms ease-out;

  &::before {
    content: '';
    position: absolute;
    top: 8px;
    right: 8px;
    width: 16px;
    height: 16px;

    border: 2px solid ${({ $shadow }) => $shadow};
    border-radius: 50%;
    background: ${({ $accent }) => $accent};
    box-shadow: 0 2px 0 ${({ $shadow }) => $shadow};
    z-index: 2;
  }

  > .info {
    margin-top: 7px;
    padding: 0 2px;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 7px 0 ${({ $shadow }) => $shadow};
    filter: brightness(1.01);
  }

  &:active {
    transform: translateY(5px);
    box-shadow: none;
    transition:
      transform 60ms ease-in,
      box-shadow 60ms ease-in,
      filter 60ms ease-in;
  }
`;

const RecordScene = styled.div<{
  $accent: string;
  $shadow: string;
}>`
  position: relative;
  aspect-ratio: 1;
  overflow: visible;

  border-radius: 8px;
  background:
    radial-gradient(circle at 18% 16%, rgb(255 255 255 / 0.9) 0 10px, transparent 11px),
    linear-gradient(135deg, rgb(255 255 255), rgb(247 253 248));

  > .disc {
    position: absolute;
    top: 8%;
    right: 2%;
    width: 74%;
    aspect-ratio: 1;
    z-index: 1;

    border: 3px solid ${({ $shadow }) => $shadow};
    border-radius: 50%;
    background:
      radial-gradient(circle, #fff 0 8%, ${({ $accent }) => $accent} 8.5% 20%, transparent 20.5%),
      repeating-radial-gradient(circle, rgb(255 255 255 / 0.16) 0 3px, transparent 3px 10px),
      radial-gradient(circle at 32% 28%, rgb(255 255 255 / 0.36), transparent 22%),
      linear-gradient(145deg, rgb(50 52 62), rgb(28 31 38));
    box-shadow: 0 5px 0 ${({ $shadow }) => $shadow};
  }

  > .disc::before {
    content: '';
    position: absolute;
    inset: 8%;

    border: 2px solid rgb(255 255 255 / 0.22);
    border-radius: 50%;
  }

  > .sleeve {
    position: absolute;
    left: 3%;
    bottom: 6%;
    width: 80%;
    aspect-ratio: 1;
    z-index: 3;

    overflow: hidden;
    border: 3px solid ${({ $shadow }) => $shadow};
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 5px 0 ${({ $shadow }) => $shadow};
    transform: rotate(-4deg);
  }

  > .tonearm {
    position: absolute;
    top: 14%;
    right: 15%;
    width: 26%;
    height: 8px;
    z-index: 2;

    border: 2px solid ${({ $shadow }) => $shadow};
    border-radius: 999px;
    background: ${({ $accent }) => $accent};
    box-shadow: 0 2px 0 ${({ $shadow }) => $shadow};
    transform: rotate(36deg);
    transform-origin: right center;
  }

  > .tonearm::before {
    content: '';
    position: absolute;
    right: -8px;
    top: 50%;
    width: 12px;
    height: 12px;

    border: 2px solid ${({ $shadow }) => $shadow};
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 2px 0 ${({ $shadow }) => $shadow};
    transform: translateY(-50%);
  }

  > .tonearm::after {
    content: '';
    position: absolute;
    left: -6px;
    top: 50%;
    width: 10px;
    height: 13px;

    border: 2px solid ${({ $shadow }) => $shadow};
    border-radius: 4px;
    background: rgb(255 255 255);
    box-shadow: 0 2px 0 ${({ $shadow }) => $shadow};
    transform: translateY(-50%) rotate(-10deg);
  }

  > .sleeve > .artwork {
    width: 100%;
    height: 100%;
    border-radius: 5px;
    background: #fff;
  }

  > .sleeve > .artwork img {
    object-fit: contain;
  }

`;

const ProfileScene = styled.div<{
  $accent: string;
  $shadow: string;
}>`
  position: relative;
  min-height: 98px;
  padding: 4px 6px;

  display: grid;
  grid-template-columns: 94px minmax(0, 1fr);
  align-items: center;
  gap: 8px;

  overflow: hidden;
  border-radius: 8px;
  background:
    radial-gradient(circle at 88% 22%, rgb(255 255 255 / 0.85) 0 13px, transparent 14px),
    linear-gradient(135deg, rgb(255 255 255), rgb(239 249 255));

  &::before {
    content: '';
    position: absolute;
    right: 13px;
    bottom: 13px;
    width: 46px;
    height: 8px;

    border-radius: 999px;
    background: ${({ $accent }) => $accent};
    box-shadow:
      -18px -14px 0 rgb(229 244 255),
      0 4px 0 ${({ $shadow }) => $shadow};
  }

  > .avatar-frame {
    position: relative;
    width: 94px;
    aspect-ratio: 1;

    border: 3px solid ${({ $shadow }) => $shadow};
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 4px 0 ${({ $shadow }) => $shadow};
  }

  > .avatar-frame::before {
    content: '';
    position: absolute;
    inset: -7px -4px auto auto;
    width: 18px;
    height: 18px;

    border: 2px solid ${({ $shadow }) => $shadow};
    border-radius: 50%;
    background: ${({ $accent }) => $accent};
    z-index: 2;
  }

  > .avatar-frame > .avatar {
    width: 100%;
    height: 100%;
  }

  > .profile-info {
    position: relative;
    z-index: 1;
    min-width: 0;
    padding-right: 4px;
  }

  @media (max-width: 720px) {
    min-height: 124px;
    padding: 4px;

    grid-template-columns: 1fr;
    justify-items: center;
    align-content: center;
    gap: 4px;
    text-align: center;

    > .avatar-frame {
      width: 92px;
    }

    > .profile-info {
      width: 100%;
      padding-right: 0;
    }
  }
`;

function Wrapper({
  src,
  info,
  accent = 'rgb(88 204 2)',
  shadow = 'rgb(88 167 0)',
  variant = 'record',
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  src: string;
  info: ReactNode;
  accent?: string;
  shadow?: string;
  variant?: Variant;
}) {
  return (
    <Style $accent={accent} $shadow={shadow} $variant={variant} {...props}>
      {variant === 'profile' ? (
        <ProfileScene $accent={accent} $shadow={shadow}>
          <div className="avatar-frame">
            <Cover
              className="avatar"
              shape={Shape.CIRCLE}
              size="100%"
              src={src}
            />
          </div>
          <div className="profile-info">{info}</div>
        </ProfileScene>
      ) : (
        <>
          <RecordScene $accent={accent} $shadow={shadow}>
            <div className="disc" />
            <div className="tonearm" />
            <div className="sleeve">
              <Cover className="artwork" size="100%" src={src} />
            </div>
          </RecordScene>
          <div className="info">{info}</div>
        </>
      )}
    </Style>
  );
}

export default Wrapper;

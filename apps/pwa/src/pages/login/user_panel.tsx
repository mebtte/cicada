import { useLocation } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import p from '@/global_states/profile';
import { Profile as ProfileType } from '@/constants/user';
import getRandomCover from '@/utils/get_random_cover';
import { ReactNode, useEffect } from 'react';
import parseSearch from '@/utils/parse_search';
import { Query } from '@/constants';
import useNavigate from '@/utils/use_navigate';
import Cover, { Shape } from '@/components/cover';
import { CSSVariable } from '@/global_style';
import Paper from './paper';
import Logo from './logo';

const REDIRECT_DURATION = 5000;
const NICKNAME_MAX_LENGTH = 10;
const DEFAULT_AVATAR = getRandomCover();
const progress = keyframes`
  0% {
    transform: scaleX(0%);
  } 100% {
    transform: scaleX(100%);
  }
`;
const Style = styled(Paper)`
  display: flex;
  flex-direction: column;
  gap: 20px;

  > .avatar {
    align-self: center;
  }

  > .text {
    text-align: center;
    font-size: 18px;
  }

  > .progress {
    position: relative;

    height: 5px;

    background-color: ${CSSVariable.COLOR_PRIMARY_DISABLED};
    border-radius: 2px;
    overflow: hidden;

    &::after {
      content: '';

      position: absolute;
      width: 100%;
      height: 100%;

      background-color: ${CSSVariable.COLOR_PRIMARY};
      transform-origin: left;
      animation: ${progress} ${REDIRECT_DURATION}ms linear;
    }
  }
`;

function Profile({ profile }: { profile: ProfileType }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const query = parseSearch<Query>(location.search);
      const redirect = query.redirect || '/';
      navigate({ path: redirect });
    }, REDIRECT_DURATION);
    return () => window.clearTimeout(timer);
  }, [location.search, navigate]);

  return (
    <>
      <Logo />
      <Cover
        className="avatar"
        src={profile.avatar || DEFAULT_AVATAR}
        size={100}
        shape={Shape.CIRCLE}
      />
      <div className="text">
        🎉 欢迎回来,{' '}
        {profile.nickname.length > NICKNAME_MAX_LENGTH
          ? `${profile.nickname.slice(0, NICKNAME_MAX_LENGTH)}...`
          : profile.nickname}
      </div>
      <div className="progress" />
    </>
  );
}

function UserPanel() {
  const profile = p.useState();

  let content: ReactNode = null;
  if (profile) {
    content = <Profile profile={profile} />;
  }

  return <Style>{content}</Style>;
}

export default UserPanel;

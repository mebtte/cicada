import { useHistory, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import u from '@/global_state/user';
import getRandomCover from '@/utils/get_random_cover';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { useEffect } from 'react';
import parseSearch from '@/utils/parse_search';
import { LoginQuery } from '@/constants/query';
import Logo from './logo';
import { panelCSS } from './constants';

const NICKNAME_MAX_LENGTH = 10;
const DEFAULT_AVATAR = getRandomCover();
const Style = styled(Paper)`
  ${panelCSS}

  .avatar-box {
    display: flex;
    align-items: center;
    justify-content: center;

    > .avatar {
      width: 100px;
      height: 100px;
    }
  }

  .text {
    text-align: center;
    font-size: 18px;
  }
`;

function UserPanel({ visible }: { visible: boolean }) {
  const history = useHistory();
  const location = useLocation();
  const user = u.useState();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const query = parseSearch<LoginQuery>(location.search);
      const redirect = query.redirect || '/';
      history.push(redirect);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [history, location.search]);

  return (
    <Style visible={visible ? 1 : 0}>
      <Stack spacing={4}>
        <Logo />
        <div className="avatar-box">
          <Avatar className="avatar" src={user!.avatar || DEFAULT_AVATAR} />
        </div>
        <Typography className="text">
          🎉 欢迎回来,{' '}
          {user!.nickname.length > NICKNAME_MAX_LENGTH
            ? `${user!.nickname.slice(0, NICKNAME_MAX_LENGTH)}...`
            : user!.nickname}
        </Typography>
        <LinearProgress />
      </Stack>
    </Style>
  );
}

export default UserPanel;

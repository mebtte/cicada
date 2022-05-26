import styled from 'styled-components';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

const Style = styled.div`
  min-height: 100vh;

  display: flex;
  align-items: center;
  justify-content: center;

  > .container {
    width: 80%;
    max-width: 350px;
    padding: 30px;

    display: flex;
    flex-direction: column;
  }
`;

function Login() {
  return (
    <Style>
      <Paper className="container">
        <Stack spacing={2}>
          <TextField label="邮箱" />
          <Button variant="contained">下一步</Button>
        </Stack>
      </Paper>
    </Style>
  );
}

export default Login;

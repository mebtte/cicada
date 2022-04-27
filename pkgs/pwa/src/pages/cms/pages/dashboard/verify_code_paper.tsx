import React from 'react';

import { Name } from '@/components/icon';
import Paper from './paper';

const VerifyCodePaper = ({ total }: { total: number }) => (
  <Paper
    label="发送验证码次数"
    icon={Name.SHIELD_FILL}
    value={total.toString()}
  />
);

export default VerifyCodePaper;

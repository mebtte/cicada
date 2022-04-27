import React, { ReactNode } from 'react';
import styled from 'styled-components';

import scrollbarAsNeeded from '@/style/scrollbar_as_needed';
import { RequestStatus } from '@/constants';
import ErrorCard from '@/components/error_card';
import CircularLoader from '@/components/circular_loader';
import { cmsPage } from '../../style';
import useSummaryData from './use_summary_data';
import UserPaper from './user_paper';
import FigurePaper from './figure_paper';
import MusicPaper from './music_paper';
import MusicbillPaper from './musicbill_paper';
import VerifyCodePaper from './verify_code_paper';
import MusicPlayLogPaper from './music_play_log_paper';
import Search from './search';
import EmailNotificationPaper from './email_notification_paper';

const Style = styled.div`
  ${cmsPage};
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow: auto;
  ${scrollbarAsNeeded}
  > .loading {
    padding: 50px 0;
    text-align: center;
  }
  > .error-card {
    padding: 50px 0;
  }
  > .paper-list {
    padding: 0 20px;
    box-sizing: border-box;
    text-align: center;
  }
`;

const Dashboard = () => {
  const { data, retry } = useSummaryData();

  let content: ReactNode = null;
  if (data.status === RequestStatus.SUCCESS) {
    content = (
      <div className="paper-list">
        <UserPaper total={data.value.user_total} />
        <FigurePaper total={data.value.figure_total} />
        <MusicPaper total={data.value.music_total} />
        <MusicPlayLogPaper total={data.value.music_play_record_total} />
        <MusicbillPaper total={data.value.musicbill_total} />
        <VerifyCodePaper total={data.value.verify_code_total} />
        <EmailNotificationPaper total={data.value.email_notification_total} />
      </div>
    );
  } else if (data.status === RequestStatus.ERROR) {
    content = (
      <ErrorCard
        className="error-card"
        errorMessage={data.error.message}
        retry={retry}
      />
    );
  } else {
    content = (
      <div className="loading">
        <CircularLoader />
      </div>
    );
  }
  return (
    <Style>
      <Search />
      {content}
    </Style>
  );
};

export default Dashboard;

import Drawer, { Title } from '@/components/drawer';
import server from '@/global_states/server';
import { CSSVariable } from '@/global_style';
import { t } from '@/i18n';
import absoluteFullSize from '@/style/absolute_full_size';
import scrollbar from '@/style/scrollbar';
import { CSSProperties, useEffect } from 'react';
import styled from 'styled-components';
import IconButton from '@/components/icon_button';
import { MdDeleteOutline } from 'react-icons/md';
import ellipsis from '@/style/ellipsis';
import upperCaseFirstLetter from '@/style/upper_case_first_letter';
import dialog from '@/utils/dialog';

const bodyProps: {
  style: CSSProperties;
} = {
  style: {
    width: 300,
  },
};
const Style = styled.div`
  ${absoluteFullSize}

  overflow: auto;
  ${scrollbar}

  >.list {
    > .server {
      margin: 0 15px 20px 15px;
      padding: 10px 15px;

      display: flex;
      align-items: center;
      gap: 10px;

      border-radius: ${CSSVariable.BORDER_RADIUS_NORMAL};
      background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_ONE};

      &:hover {
        background-color: ${CSSVariable.BACKGROUND_COLOR_LEVEL_TWO};
      }

      > .info {
        flex: 1;
        min-width: 0;

        line-height: 1.5;

        > .name {
          font-size: ${CSSVariable.TEXT_SIZE_NORMAL};
          color: ${CSSVariable.TEXT_COLOR_PRIMARY};
        }

        > .origin {
          font-size: ${CSSVariable.TEXT_SIZE_SMALL};
          color: ${CSSVariable.TEXT_COLOR_SECONDARY};
          ${ellipsis}
        }

        > .users {
          font-size: ${CSSVariable.TEXT_SIZE_SMALL};
          color: ${CSSVariable.TEXT_COLOR_SECONDARY};
          ${upperCaseFirstLetter}
        }
      }

      > .delete {
        color: ${CSSVariable.COLOR_DANGEROUS};
      }
    }
  }
`;

function ManageDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { serverList } = server.useState();

  useEffect(() => {
    if (!serverList.length) {
      onClose();
    }
  }, [onClose, serverList.length]);

  return (
    <Drawer open={open} onClose={onClose} bodyProps={bodyProps}>
      <Style>
        <Title> {t('manage_origins')}</Title>
        <div className="list">
          {serverList.map((s) => (
            <div key={s.origin} className="server">
              <div className="info">
                <div className="name">{s.hostname}</div>
                <div className="origin">{s.origin}</div>
                <div className="users">
                  {t('origin_users_count', s.users.length.toString())}
                </div>
              </div>
              <IconButton
                className="delete"
                size={24}
                onClick={() =>
                  dialog.confirm({
                    content: t('delete_origin_question'),
                    onConfirm: () =>
                      server.set((ss) => ({
                        ...ss,
                        serverList: ss.serverList.filter(
                          (is) => is.origin !== s.origin,
                        ),
                      })),
                  })
                }
              >
                <MdDeleteOutline />
              </IconButton>
            </div>
          ))}
        </div>
      </Style>
    </Drawer>
  );
}

export default ManageDrawer;

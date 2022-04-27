import React, { HTMLAttributes, useRef, useState } from 'react';
import styled from 'styled-components';
import debounce from 'lodash/debounce';
import { useHistory } from 'react-router-dom';

import { CMS_PATH } from '@/constants/route';
import Button, { Type as ButtonType } from '@/components/button';
import ellipsis from '@/style/ellipsis';
import IconButton, { Name, Type } from '@/components/icon_button';
import logger from '@/platform/logger';
import toast from '@/platform/toast';
import cmsSearchFigureList, {
  KEYWORD_MAX_LENGTH,
} from '@/server/cms_search_figure_list';
import Select from '@/components/select';
import Label from '@/components/label';
import { Figure } from './constants';
import { Query } from '../figure/constants';

const Style = styled.div`
  > .input {
    display: flex;
    align-items: center;
    gap: 10px;
    > .select {
      flex: 1;
      min-width: 0;
    }
  }
  > .singer-list {
    > .singer {
      display: flex;
      gap: 10px;
      padding: 10px 12px;
      background-color: #f6f6f6;
      border-radius: 4px;
      margin: 5px 0;
      > .name {
        flex: 1;
        min-width: 0;
        font-size: 14px;
        color: #333;
        ${ellipsis}
      }
    }
  }
`;
const itemRenderer = (singer: Figure | null) =>
  singer ? `${singer.name}${singer.alias ? `(${singer.alias})` : ''}` : null;

const SingerListSelector = ({
  singerList,
  onSingerSelect,
  onSingerRemove,
  disabled,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  singerList: Figure[];
  onSingerSelect: (singer: Figure) => void;
  onSingerRemove: (singer: Figure) => void;
  disabled: boolean;
}) => {
  const history = useHistory();

  const [loading, setLoading] = useState(0);
  const [searchSingerList, setSearchSingerList] = useState<Figure[]>([]);

  const onInputChangeRef = useRef(
    debounce(async (keyword: string) => {
      if (!keyword) {
        return setSearchSingerList([]);
      }
      setLoading((l) => l + 1);
      try {
        const fl = await cmsSearchFigureList({
          keyword: keyword.slice(0, KEYWORD_MAX_LENGTH),
          size: 50,
        });
        setSearchSingerList(fl);
      } catch (error) {
        logger.error(error, { description: '搜索角色列表失败', report: true });
        toast.error(error.message);
      }
      setLoading((l) => l - 1);
    }, 500),
  );
  const onCreateSinger = () =>
    history.push(`${CMS_PATH.FIGURE}?${Query.CREATE_DIALOG_OPEN}=1`);

  return (
    <Label {...props} label="歌手列表">
      <Style>
        <div className="input">
          <Select
            className="select"
            value={null}
            onChange={onSingerSelect}
            array={searchSingerList}
            itemRenderer={itemRenderer}
            onInputChange={onInputChangeRef.current}
            loading={loading > 0}
            placeholder="搜索歌手"
            disabled={disabled}
          />
          <Button
            label="创建歌手"
            type={ButtonType.PRIMARY}
            onClick={onCreateSinger}
            disabled={disabled}
          />
        </div>
        <div className="singer-list">
          {singerList.map((singer) => (
            <div className="singer" key={singer.id}>
              <div className="name">
                {singer.name}
                {singer.alias ? `(${singer.alias})` : ''}
              </div>
              <IconButton
                name={Name.WRONG_OUTLINE}
                size={18}
                type={Type.DANGER}
                onClick={() => onSingerRemove(singer)}
                disabled={disabled}
              />
            </div>
          ))}
        </div>
      </Style>
    </Label>
  );
};

export default SingerListSelector;

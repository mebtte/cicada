import { Drawer, DrawerContent, MultiSelect, SelectOption } from '@/components';
import styled from 'styled-components';
import { useCallback, useEffect, useState } from 'react';
import dialog from '@/utils/dialog';
import logger from '@/utils/logger';
import { CSSVariable } from '@/global_style';
import autoScrollbar from '@/style/auto_scrollbar';
import { t } from '@/i18n';
import { SEARCH_KEYWORD_MAX_LENGTH as ARTIST_SEARCH_KEYWORD_MAX_LENGTH } from '@/constants/artist';
import useTitlebarOverlayInsets from '@/utils/use_titlebar_overlay_insets';
import upperCaseFirstLetter from '@/utils/upper_case_first_letter';
import searchArtistRequest from '@/server/api/search_artist';
import getMusicbillFollowedArtistList from '@/server/api/get_musicbill_followed_artist_list';
import addMusicbillFollowedArtist from '@/server/api/add_musicbill_followed_artist';
import Empty from '@/components/empty';
import e, { EventType } from '../eventemitter';
import Artist from './artist';
import ConsequenceList from './consequence_list';

type FollowedArtist = {
  id: string;
  name: string;
  aliases: string[];
  photos: { asset: string }[];
};

const Content = styled.div`
  height: 100%;
  min-height: 0;
  box-sizing: border-box;

  display: flex;
  flex-direction: column;
  background: #fff;
`;
const SearchBar = styled.div`
  flex: 0 0 auto;
  padding: 14px 18px;
  border-bottom: 2px solid ${CSSVariable.COLOR_BORDER};
`;
const List = styled.div`
  flex: 1;
  min-height: 0;
  padding: 18px 14px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  ${autoScrollbar}
`;

type ArtistOption = { id: string; name: string; aliases: string[] };

const formatArtistToOption = (artist: ArtistOption): SelectOption<ArtistOption> => ({
  label: `${artist.name}${artist.aliases.length ? `(${artist.aliases[0]})` : ''}`,
  value: artist,
});

const searchArtist = (search: string): Promise<SelectOption<ArtistOption>[]> => {
  const keyword = search.trim().substring(0, ARTIST_SEARCH_KEYWORD_MAX_LENGTH);
  if (!keyword) {
    return Promise.resolve([]);
  }
  return searchArtistRequest({ keyword, page: 1, pageSize: 50 }).then((data) =>
    data.artistList.map((a) =>
      formatArtistToOption({ id: a.id, name: a.name, aliases: a.aliases }),
    ),
  );
};

function FollowedArtistDrawer({
  open,
  onClose,
  musicbillId,
  zIndex,
}: {
  open: boolean;
  onClose: () => void;
  musicbillId: string;
  zIndex: number;
}) {
  const { top: titlebarTop } = useTitlebarOverlayInsets();
  const [artists, setArtists] = useState<FollowedArtist[]>([]);

  const reload = useCallback(() => {
    if (!musicbillId) return;
    getMusicbillFollowedArtistList({ musicbillId })
      .then((data) => setArtists(data ?? []))
      .catch((error) => {
        logger.error(error, 'Failed to load followed artist list');
        dialog.alert({ content: error.message });
      });
  }, [musicbillId]);

  useEffect(() => {
    if (open && musicbillId) {
      reload();
    }
  }, [open, musicbillId, reload]);

  const onPickArtist = useCallback(
    (opts: SelectOption<ArtistOption>[]) => {
      if (!opts.length) return;
      const picked = opts[opts.length - 1].value;
      if (artists.some((a) => a.id === picked.id)) {
        dialog.alert({ content: t('repeated_followed_artist') });
        return;
      }
      dialog.confirm({
        title: t('follow_artist_question', picked.name),
        content: (
          <ConsequenceList>
            <li>{t('follow_artist_consequence_1')}</li>
            <li>{t('follow_artist_consequence_2')}</li>
          </ConsequenceList>
        ),
        confirmVariant: 'primary',
        onConfirm: async () => {
          try {
            await addMusicbillFollowedArtist({
              musicbillId,
              artistId: picked.id,
            });
            reload();
            e.emit(EventType.RELOAD_MUSICBILL, {
              id: musicbillId,
              silence: true,
            });
          } catch (error) {
            logger.error(error, 'Failed to follow artist');
            dialog.alert({ content: error.message });
            return false;
          }
        },
      });
    },
    [artists, musicbillId, reload],
  );

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent
        side="right"
        accessibleTitle={t('followed_artist')}
        style={{ width: 340 }}
        zIndex={zIndex}
      >
        <Content style={{ paddingTop: titlebarTop }}>
          <SearchBar>
            <MultiSelect
              value={[]}
              loadOptions={searchArtist}
              onChange={onPickArtist}
              placeholder={upperCaseFirstLetter(t('follow_artist'))}
            />
          </SearchBar>
          <List>
            {artists.length === 0 ? (
              <Empty
                description={t('no_followed_artist')}
                style={{ margin: 'auto' }}
              />
            ) : (
              artists.map((artist) => (
                <Artist
                  key={artist.id}
                  artist={artist}
                  musicbillId={musicbillId}
                  onChanged={reload}
                />
              ))
            )}
          </List>
        </Content>
      </DrawerContent>
    </Drawer>
  );
}

export default FollowedArtistDrawer;

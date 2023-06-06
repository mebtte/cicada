import getSharedMusicbillInvitationList from '@/server/api/get_shared_musicbill_invitation_list';

export type Invitation = AsyncReturnType<
  typeof getSharedMusicbillInvitationList
>[0];

export interface Singer {
  id: string;
  name: string;
  aliases: string[];
  createTime: string;
  musicCount: number;

  index: number;
}

export const TOOLBAR_HEIGHT = 60;

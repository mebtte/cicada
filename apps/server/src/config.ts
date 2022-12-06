export interface Config {
  base: string;
  port: number;
  emailHost: string;
  emailPort: number;
  emailUser: string;
  emailPass: string;
  userMusicbillMaxAmount: number;
  userExportMusicbillMaxTimesPerDay: number;
  userCreateMusicMaxTimesPerDay: number;
  publicOrigin: string;
  initialAdminEmail: string;
}

let config: Config = {
  emailHost: '',
  emailPort: 465,
  emailUser: '',
  emailPass: '',

  base: `${process.cwd()}/cicada`,
  port: 8000,
  userMusicbillMaxAmount: 100,
  userExportMusicbillMaxTimesPerDay: 3,
  userCreateMusicMaxTimesPerDay: 5,
  publicOrigin: '',
  initialAdminEmail: '',
};

export default {
  get(): Config {
    return config;
  },
  set(c: Partial<Config>) {
    config = {
      ...config,
      ...c,
    };
  },
};

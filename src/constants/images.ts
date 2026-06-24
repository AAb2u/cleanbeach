import { ImageSourcePropType } from 'react-native';

export const AppImages: Record<'authBeach' | 'homeCleanup' | 'reportKit', ImageSourcePropType> = {
  authBeach: require('../../public/images/auth-beach.png'),
  homeCleanup: require('../../public/images/home-cleanup.png'),
  reportKit: require('../../public/images/report-kit.png'),
};

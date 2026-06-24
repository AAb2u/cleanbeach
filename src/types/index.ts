export type PollutionSeverity = 'low' | 'medium' | 'high';
export type BeachStatus = 'polluted' | 'cleaning' | 'cleaned';

export interface BeachReport {
  id: string;
  title: string;
  description: string;
  severity: PollutionSeverity;
  status: BeachStatus;
  latitude: number;
  longitude: number;
  locationName: string;
  imageUrls: string[];
  userId: string;
  userName: string;
  createdAt: Date;
  likes: number;
  confirmations: number;
  likedBy: string[];
  confirmedBy: string[];
}

export interface Comment {
  id: string;
  reportId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: Date;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  reportsCount: number;
  contributionPoints: number;
  badges: string[];
  isAdmin: boolean;
  expoPushToken?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'new_report' | 'status_change';
  reportId?: string;
  read: boolean;
  createdAt: Date;
}

export interface BeachStats {
  total: number;
  polluted: number;
  cleaning: number;
  cleaned: number;
  highSeverity: number;
}

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Report: undefined;
  BeachDetails: { beachId: string };
  Admin: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Map: undefined;
  List: undefined;
  Profile: undefined;
};

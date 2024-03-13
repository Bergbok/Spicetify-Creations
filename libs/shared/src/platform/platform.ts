// Last updated: March 2023

import type { ClipboardAPI } from './clipboard';
import type { LocalFilesAPI } from './local-files';
import type { PlayerAPI } from './player';
import type { PlaylistAPI } from './playlist';
import type { RootlistAPI } from './rootlist';
import type { Session } from './session';
import type { Translations } from './translations';
import type { UserAPI } from './user';
import type { History } from './history';
import type { ShowAPI } from './show';
import type { LocalStorageAPI } from './local-storage';
import type { LibraryAPI } from './library';

export type Platform = {
    Session: Session;
    Transport: unknown;
    EventSender: unknown;
    Translations: Translations;
    FeatureFlags: unknown;
    History: History;
    AdManagers: unknown;
    RemoteConfiguration: unknown;
    ActionStoreAPI: unknown;
    AuthorizationAPI: unknown;
    ClipboardAPI: ClipboardAPI;
    ConnectAPI: unknown;
    SocialConnectAPI: unknown;
    ControlMessageAPI: unknown;
    FacebookAPI: unknown;
    FollowAPI: unknown;
    GraphQLLoader: unknown;
    LibraryAPI: LibraryAPI;
    LocalFilesAPI: LocalFilesAPI;
    OfflineAPI: unknown;
    PlatformData: unknown;
    PlayerAPI: PlayerAPI;
    ShuffleAPI: unknown;
    PlayHistoryAPI: unknown;
    PlaylistAPI: PlaylistAPI;
    PlaylistPermissionsAPI: unknown;
    PrivateSessionAPI: unknown;
    RadioStationAPI: unknown;
    RecaptchaLoggerAPI: unknown;
    RecentlyPlayedAPI: unknown;
    ReportAPI: unknown;
    RootlistAPI: RootlistAPI;
    SegmentsAPI: unknown;
    ShowAPI: ShowAPI;
    AudiobooksPremiumConsumptionCapObserverAPI: unknown;
    UpdateAPI: unknown;
    UserAPI: UserAPI;
    VideoAPI: unknown;
    EnhanceAPI: unknown;
    SEOExperiments: unknown;
    SingAlongAPI: unknown;
    PlaybackAPI: unknown;
    UBILogger: unknown;
    CollectionPlatformAPI: unknown;
    LocalStorageAPI: LocalStorageAPI;
    IndexedDbAPI: unknown;
    EqualizerAPI: unknown;
    BuddyFeedAPI: unknown;
    PanelAP: unknown;
};
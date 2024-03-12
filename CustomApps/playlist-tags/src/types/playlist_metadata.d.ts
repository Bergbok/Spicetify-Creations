export type PlaylistMetadata = {
    type: string;
    uri: string;
    name: string;
    description: string;
    images: Image[];
    madeFor: User;
    owner: User;
    totalLength: number;
    unfilteredTotalLength: number;
    totalLikes: number;
    duration: Duration;
    isLoaded: boolean;
    isOwnedBySelf: boolean;
    isPublished: boolean;
    hasEpisodes: boolean;
    hasSpotifyTracks: boolean;
    hasSpotifyAudiobooks: boolean;
    canAdd: boolean;
    canRemove: boolean;
    canPlay: boolean;
    formatListData: FormatListData;
    canReportAnnotationAbuse: boolean;
    hasDateAdded: boolean;
    permissions: Permissions;
    collaborators: Collaborators;
};

type Image = {
    url: string;
    label: string;
};

type User = {
    type: string;
    uri: string;
    username: string;
    displayName: string;
    images: Image[];
};

type Duration = {
    milliseconds: number;
    isEstimate: boolean;
};

type FormatListData = {
    type: string;
    attributes: Record<string, string>;
};

type Permissions = {
    canView: boolean;
    canAdministratePermissions: boolean;
    canCancelMembership: boolean;
    isPrivate: boolean;
};

type Collaborator = {
    isOwner: boolean;
    tracksAdded: number;
    user: User;
};

type Collaborators = {
    count: number;
    items: Collaborator[];
};
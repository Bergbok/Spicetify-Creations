export type PlaylistContents = {
    items: Item[];
    offset: number;
    limit: number;
    totalLength: number;
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

type Artist = {
    type: string;
    uri: string;
    name: string;
};

type Album = {
    type: string;
    uri: string;
    name: string;
    artist: Artist;
    images: Image[];
};

type Duration = {
milliseconds: number;   
};

type Item = {
    uid: string;
    playIndex: null | number;
    addedAt: string;
    addedBy: User;
    formatListAttributes: Record<string, unknown>;
    type: string;
    uri: string;
    name: string;
    album: Album;
    artists: Artist[];
    discNumber: number;
    trackNumber: number;
    duration: Duration;
    isExplicit: boolean;
    isLocal: boolean;
    isPlayable: boolean;
    is19PlusOnly: boolean;
    hasAssociatedVideo: boolean;
};
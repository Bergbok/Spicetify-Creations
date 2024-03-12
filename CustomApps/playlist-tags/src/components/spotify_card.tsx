// Modified version of https://github.com/harbassan/spicetify-apps/blob/main/shared/components/spotify_card.tsx

import React from "react";
import he from 'he';

interface SpotifyCardProps {
    type: "artist" | "album" | "playlist" | "show";
    uri: string;
    header: string;
    subheader: string;
    imageUrl: string;
    className?: string;
}

function SpotifyCard(props: SpotifyCardProps): React.ReactElement<HTMLDivElement> {
    // @ts-ignore
    const { Cards, TextComponent, ArtistMenu, AlbumMenu, PodcastShowMenu, PlaylistMenu, ContextMenu } = Spicetify.ReactComponent;
    const { Default: Card, CardImage } = Cards;
    const { type, header, uri, imageUrl, subheader, className } = props;

    const Menu = () => {
        switch (type) {
            case "artist":
                return <ArtistMenu uri={uri} />;
            case "album":
                return <AlbumMenu uri={uri} />;
            case "playlist":
                return <PlaylistMenu uri={uri} />;
            case "show":
                return <PodcastShowMenu uri={uri} />;
            default:
                return <></>;
        }
    };

    return (
        <div className={className}>
            <ContextMenu menu={Menu()} trigger="right-click">
                <Card
                    featureIdentifier={type}
                    headerText={header}
                    renderCardImage={() => (
                        <CardImage
                            images={[
                                {
                                    height: 640,
                                    url: imageUrl,
                                    width: 640,
                                },
                            ]}
                            isCircular={type === "artist"}/>
                    )}
                    renderSubHeaderContent={() => (
                        <TextComponent 
                            as="div" 
                            variant="mesto" 
                            semanticColor="textSubdued" 
                            children={he.decode(subheader)} 
                            style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}/>
                    )}
                    uri={uri}/>
            </ContextMenu>
        </div>
    );
}

export default SpotifyCard;

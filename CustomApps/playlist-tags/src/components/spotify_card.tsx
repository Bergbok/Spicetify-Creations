// Modified version of https://github.com/harbassan/spicetify-apps/blob/main/shared/components/spotify_card.tsx

import React from "react";
import he from 'he';

/**
 * Props for the SpotifyCard component.
 * 
 * @typedef {Object} SpotifyCardProps
 * @property {"artist" | "album" | "playlist" | "show"} type - The type of the Spotify card.
 * @property {string} uri - The Spotify URI of the item.
 * @property {string} header - The header text of the card.
 * @property {string} subheader - The subheader text of the card.
 * @property {string} imageUrl - The URL of the image to display on the card.
 * @property {string} [className] - An optional class name for the card.
 */
interface SpotifyCardProps {
    type: "artist" | "album" | "playlist" | "show";
    uri: string;
    header: string;
    subheader: string;
    imageUrl: string;
    className?: string;
}

/**
 * A component that displays a Spotify card with a context menu.
 * The card displays an image, a header, and a subheader.
 * The context menu varies depending on the type of the card.
 * 
 * @param {SpotifyCardProps} props - The props for the component.
 * @returns {React.ReactElement<HTMLDivElement>} The SpotifyCard component.
 */
function SpotifyCard(props: SpotifyCardProps): React.ReactElement<HTMLDivElement> {
    // @ts-ignore
    const { Cards, TextComponent, ArtistMenu, AlbumMenu, PodcastShowMenu, PlaylistMenu, ContextMenu } = Spicetify.ReactComponent;
    const { FeatureCard: Card, CardImage } = Cards;
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
                            src={imageUrl}
                            size={640}/>
                    )}
                    renderSubHeaderContent={() => (
                        <React.Fragment>
                            <style>
                            {`
                                .playlist-text {
                                    width: 169px;
                                    overflow: hidden;
                                    text-overflow: ellipsis;
                                    white-space: nowrap;
                                    overflow-wrap: break-word;
                                }
                            `}
                            </style>
                            <TextComponent 
                                as="div" 
                                variant="mesto" 
                                semanticColor="textSubdued" 
                                children={he.decode(subheader)}
                                className="playlist-text"/>
                        </React.Fragment>
                    )}
                    uri={uri}/>
            </ContextMenu>
        </div>
    );
}

export default SpotifyCard;
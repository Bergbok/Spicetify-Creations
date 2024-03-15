import { PlaylistMetadata } from './types/playlist_metadata.d'
import { renderPlaylists, getPlaylistMetadata, getCurrentURI, getPlaylistsTaggedAs, getAllTags, addPlaylistsToQueue, removeTagFromAllPlaylists } from './funcs';
import { waitForSpicetify, waitForPlatformApi } from '@shared/utils/spicetify-utils';
import FilterDropdown from './components/filter_dropdown';
import PlayButton from './components/play_button';
import React, { useEffect, useState } from 'react';
import README from './components/README';
import ShuffleButton from './components/shuffle_toggle';
import SortDropdown from './components/sort_dropdown';
import useNavigationBar from 'spcr-navigation-bar';

const App = () => {
  const default_navbar_items = ["Search", "All Tags", "All Tagged Playlists", "README"];
  let navbar_items = default_navbar_items;
  if (!JSON.parse(Spicetify.LocalStorage.get('playlist-tags-settings.navbar-all-tags-page') || 'false').value) {
    navbar_items = navbar_items.filter(item => item !== "All Tags");
  }
  if (!JSON.parse(Spicetify.LocalStorage.get('playlist-tags-settings.navbar-all-tagged-playlists-page') || 'false').value) {
    navbar_items = navbar_items.filter(item => item !== "All Tagged Playlists");
  }
  if (!JSON.parse(Spicetify.LocalStorage.get('playlist-tags-settings.navbar-README') || 'false').value) {
    navbar_items = navbar_items.filter(item => item !== "README");
  }
  
  // @ts-ignore
  const SpotifyChip: any = Spicetify.ReactComponent.Chip;
  const [tagList, setTags] = useState(getAllTags('A-Z'));
  const [shuffleState, setIsEnabled] = useState(false);
  const [selectedSortingOption, setSortingOption] = useState('Title: A-Z');
  const [selectedFilterOption, setFilterOption] = useState('Match Any Tag (OR)');
  const [playlistData, setPlaylistData] = useState<Array<PlaylistMetadata>>([]);
  const [navBar, activeLink, setActiveLink] = useNavigationBar(navbar_items);
  const [isLoading, setIsLoading] = useState(false);
  const [inputFocused, setIsFocused] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [timeoutID, setTimeoutID] = useState<number | null>(null);

  useEffect(() => {
    if (activeLink === "Search") {
      const tags = [getCurrentURI()];
      setFilterQuery(tags.map(tag => tag).join(' '));
      const playlist_uris = getPlaylistsTaggedAs(tags, selectedFilterOption);
      setIsLoading(true);
      getPlaylistMetadata(playlist_uris).then(data => {
        setPlaylistData(data);
        setIsLoading(false);
      });
    }
    if (activeLink === "All Tagged Playlists") {
      const stored_value = Spicetify.LocalStorage.get('tags:taggedPlaylistURIs');
      const playlist_uris = stored_value ? JSON.parse(stored_value) : [];
      setIsLoading(true);
      getPlaylistMetadata(playlist_uris).then(data => {
        setPlaylistData(data);
        setIsLoading(false);
      });
    }
  }, [activeLink]);

  useEffect(() => {
    setIsLoading(true);
    const playlist_uris = getPlaylistsTaggedAs(filterQuery.trim().split(' '), selectedFilterOption);
    getPlaylistMetadata(playlist_uris).then(data => {
      setPlaylistData(data);
      setIsLoading(false);
    });
  }, [selectedFilterOption]);

  useEffect(() => {
    setIsLoading(true);

    if (timeoutID) {
      clearTimeout(timeoutID);
    }

    const newTimeoutID = window.setTimeout(() => {
      Spicetify.Platform.History.replace('/playlist-tags/' + filterQuery);
      const playlist_uris = getPlaylistsTaggedAs(filterQuery.trim().split(' '), selectedFilterOption);
      getPlaylistMetadata(playlist_uris).then(data => {
        setPlaylistData(data);
        setIsLoading(false);
      });
    }, 420); 
  
    setTimeoutID(newTimeoutID);
  }, [filterQuery]);
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilterQuery(event.target.value);
  };

  const toggleShuffle = () => {
    setIsEnabled(!shuffleState);
  };

  const toggleInputFocus = () => {
    setIsFocused(!inputFocused);
  };

  const updateTagList = () => {
    setTags(getAllTags('A-Z'));
  };

  switch (activeLink) {
    case "Search":
      return (
        <>
          <React.Fragment>
            <style>
              {`
                .input-wrapper {
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  margin-bottom: 10px;
                }
                .search-wrapper {
                  display: flex;
                  justify-content: center;
                  position: relative;
                  padding: 0;
                  margin: 0;
                  width: 100%;
                }
                .icon {
                  position: relative;
                  filter: invert(100%);
                  bottom: -14px;
                  left: 41px;
                  width: 26px;
                  height: 29px;
                  transform: scale(1.2);
                }
                .tag-search-bar {
                  width: 100%;
                  height: 48px;
                  color: var(--spice-text);
                  background-color: rgb(36, 36, 36);
                  padding: 5px;
                  border-radius: 9999px;
                  margin: 0;
                  padding-left: 42px;
                }
                .tag-search-bar:hover {
                  background-color: rgb(42, 42, 42);
                }
                .tag-search-bar:focus {
                  border-color: rgb(221, 221, 221);
                }
                .tag-list-wrapper {
                  display: flex;
                  flex-direction: row;
                  overflow-x: auto;
                  overflow-y: hidden;
                  width: 100%;
                  position: relative;
                  scrollbar-width: thin;
                  padding-left: 25px;
                  padding-top: 10px;
                  padding-bottom: 5px;
                }
                .tag-list-wrapper::after {
                  content: '';
                  position: fixed;
                  top: 120px;
                  right: 0;
                  width: 50px;
                  height: 50px;
                  background: linear-gradient(to right, rgba(255, 255, 255, 0), rgba(18, 18, 18, 1));
                  pointer-events: none;
                }
              `}
            </style>
            <div className="input-wrapper">
              <PlayButton onClick={() => {addPlaylistsToQueue(playlistData, shuffleState)}} />
              <ShuffleButton shuffleState={shuffleState} toggleShuffle={toggleShuffle} />
              <div className='search-wrapper'>
                <svg className="icon" width="24" height="24" viewBox="0 0 24 24"
                  dangerouslySetInnerHTML={{ __html: inputFocused ? Spicetify.SVGIcons["search-active"] : Spicetify.SVGIcons["search"] }}>
                </svg>
                <input
                  className='tag-search-bar'
                  type="text"
                  placeholder='Enter tags'
                  spellCheck='false'
                  value={filterQuery}
                  onFocus={toggleInputFocus}
                  onBlur={toggleInputFocus}
                  onChange={handleSearchChange}/>
              </div>
              <FilterDropdown items={['Match Any Tag (OR)', 'Match All Tags (AND)']} onSelect={(value: string) => { setFilterOption(value) }}></FilterDropdown>
              <SortDropdown items={['Title: A-Z', 'Title: Z-A', 'Description: A-Z', 'Description: Z-A']} onSelect={(value: string) => { setSortingOption(value) }} />
            </div>
            <div className='tag-list-wrapper'>
              {
                tagList.sort((a, b) => {
                  const stripped_filter_query = filterQuery.replace(/!/g, '');
                  const a_in_filter = stripped_filter_query.split(' ').includes(a);
                  const b_in_filter = stripped_filter_query.split(' ').includes(b);
                  if (a_in_filter && !b_in_filter) {
                    return -1;
                  } else if (!a_in_filter && b_in_filter) {
                    return 1;
                  } else {
                    return 0;
                  }
                }).map((tag) => {
                  const last_term: string = ((filterQuery.split(' ').pop() as string) || '').replace(/!/g, '');
                  if (tag.toLowerCase().includes(last_term.toLowerCase())) {
                    return (
                      <SpotifyChip
                        // selectedColorSet={filterQuery.split(' ').includes(tag) ? 'positive' : 'negative'}
                        className='tag-list-tag'
                        style={{ 
                          backgroundColor: filterQuery.replace(/!/g, '').split(' ').includes(tag) ? 'var(--spice-selected-row)' : '', 
                        }}
                        onClick={() => {
                          const last_term: string = (filterQuery.split(' ').pop() as string) || '';
                          const isExcluded = last_term.startsWith('!');
                          const tagWithExclusion = isExcluded ? '!' + tag : tag;
                          const excludedTag = '!' + tag;
                        
                          switch (true) {
                            // Removes exlusion tag from search
                            case filterQuery.split(' ').includes(excludedTag):
                              setFilterQuery(filterQuery.split(' ').filter(word => word !== excludedTag).join(' '));
                              break;
                            // Removes inclusion tag from search
                            case filterQuery.split(' ').includes(tag):
                              setFilterQuery(filterQuery.split(' ').filter(word => word !== tag).join(' '));
                              break;
                            // Adds tag to search
                            default:
                              setFilterQuery(filterQuery.split(' ').slice(0, -1).join(' ') + ' ' + tagWithExclusion + ' ');
                              break;
                          }
                        }}
                        onContextMenu={() => {removeTagFromAllPlaylists(tag); updateTagList()}}>{/* {tag} */}
                        <p dangerouslySetInnerHTML={{ __html: `<span style="color: ${filterQuery.replace(/!/g, '').split(' ').includes(tag) ? 'black' : 'var(--spice-text)'}">${tag}</span>` }}></p>
                      </SpotifyChip>
                    );
                  }
                })
              }
            </div>
          </React.Fragment>
          {
            playlistData && renderPlaylists(playlistData, selectedSortingOption, isLoading, filterQuery)
          }
          {navBar}
        </>
      );
    case "All Tags":
      // @ts-ignore
      const Chip: any = Spicetify.ReactComponent.Chip;
      return (
        <>
          {
            <React.Fragment>
              <style>
                {`
                  .tag-list-wrapper {
                    padding: 29px;
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                  }
                `}
              </style>
              <div className='tag-list-wrapper'>
                {
                  tagList.map((tag) => (
                    <Chip
                      className='tag-list-tag'
                      semanticColor='textBase'
                      onClick={() => {
                        if (getCurrentURI() !== '') {
                          Spicetify.Platform.History.push('/playlist-tags/' + getCurrentURI() + ' ' + tag);
                        } else {
                          Spicetify.Platform.History.push('/playlist-tags/' + tag);
                        }
                        setActiveLink('Search');
                      }}
                      onContextMenu={() => {removeTagFromAllPlaylists(tag); updateTagList()}}>{tag}
                    </Chip>
                  ))
                }
              </div>
            </React.Fragment>
          }
          {navBar}
        </>
      );
    case "All Tagged Playlists":
      return (
        <>
          {
            playlistData && renderPlaylists(playlistData, selectedSortingOption, isLoading, filterQuery)
          }
          {navBar}
        </>
      );
    case "README":
      return (
        <>
          <README raw_url='https://raw.githubusercontent.com/Bergbok/Spicetify-Creations/main/CustomApps/playlist-tags/README.md' GitHub_button_url='https://github.com/Bergbok/Spicetify-Creations/tree/dist/playlist-tags'/>
          {navBar}
        </>
      );
    default:
      return (
        <>
          <div>{"You're currently on page: " + activeLink}</div>
          {navBar}
        </>
      );
  }
};

const withSpicetifyInitialization = (WrappedComponent: React.FC) => {
  return () => {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
      const initializeSpicetify = async () => {
        await waitForSpicetify();
        await waitForPlatformApi('History');
        setIsReady(true);
      };
      initializeSpicetify();
    }, []);

    if (!isReady) {
      return (
        <h1 style={{ textAlign: 'center' }}>
          Loading...
        </h1>
      );
    }

    return <WrappedComponent/>;
  };
};

export default withSpicetifyInitialization(App);
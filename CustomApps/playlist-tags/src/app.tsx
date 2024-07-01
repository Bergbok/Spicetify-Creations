import { renderPlaylists, getPlaylistMetadata, getCurrentPageURI, getPlaylistsTaggedAs, getAllTags, addPlaylistsToQueue, removeTagFromAllPlaylists, removeStringFromStringArray, escapeRegExp } from './funcs';
import { PlaylistMetadata } from './types/playlist_metadata'
import { waitForSpicetify, waitForPlatformApi } from '@shared/utils/spicetify-utils';
import FilterDropdown from './components/filter_dropdown';
import PlayButton from './components/play_button';
import React, { useEffect, useState } from 'react';
import README from './components/README';
import ShuffleButton from './components/shuffle_toggle';
import SortDropdown from './components/sort_dropdown';
import useNavigationBar from 'spcr-navigation-bar';

/**
 * Represents the app page.
 * This is a React functional component.
 */
const App = () => {
  // Handles which items to display in the navigation bar based on user settings
  const default_navbar_items = ["Search", "All Tags", "All Tagged Playlists", "README"];
  let navbar_items = default_navbar_items;
  if (!JSON.parse(Spicetify.LocalStorage.get('playlist-tags-navbar-settings.navbar-all-tags-page') || 'false').value) {
    navbar_items = navbar_items.filter(item => item !== "All Tags");
  }
  if (!JSON.parse(Spicetify.LocalStorage.get('playlist-tags-navbar-settings.navbar-all-tagged-playlists-page') || 'false').value) {
    navbar_items = navbar_items.filter(item => item !== "All Tagged Playlists");
  }
  if (!JSON.parse(Spicetify.LocalStorage.get('playlist-tags-navbar-settings.navbar-README') || 'false').value) {
    navbar_items = navbar_items.filter(item => item !== "README");
  }
  
  // @ts-ignore (needed because the Chip component not present in spicetify.d.ts).
  const SpotifyChip: any = Spicetify.ReactComponent.Chip;

  // React State Hooks 
  const [filterQuery, setFilterQuery] = useState('');
  const [inputFocused, setIsFocused] = useState(false);
  const [inputHovered, setInputHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [navBar, activeLink, setActiveLink] = useNavigationBar(navbar_items);
  const [navBarValue, setNavBarValue] = useState('');
  const [playlistData, setPlaylistData] = useState<Array<PlaylistMetadata>>([]);
  const [selectedFilterOption, setFilterOption] = useState('Match Any Tag (OR)');
  const [selectedSortingOption, setSortingOption] = useState('Title: A-Z');
  const [shuffleState, setIsEnabled] = useState(false);
  const [tagList, setTags] = useState(getAllTags('A-Z'));
  const [timeoutID, setTimeoutID] = useState<number | null>(null);

  useEffect(() => {
    const expFeatures = JSON.parse(Spicetify.LocalStorage.get('spicetify-exp-features') || '{}');
    const navBarValue = expFeatures.enableGlobalNavBar?.value;
    setNavBarValue(navBarValue);
  }, []);

  // Updates playlist data when the active navigation bar tab changes.
  useEffect(() => {
    if (activeLink === 'Search') {
      const tags = [getCurrentPageURI()];
      setFilterQuery(tags.map(tag => tag).join(' '));
      const playlist_uris = getPlaylistsTaggedAs(tags, selectedFilterOption);
      setIsLoading(true);
      getPlaylistMetadata(playlist_uris).then(data => {
        setPlaylistData(data);
        setIsLoading(false);
      });
    }
    if (activeLink === 'All Tagged Playlists') {
      const stored_value = Spicetify.LocalStorage.get('tags:taggedPlaylistURIs');
      const playlist_uris = stored_value ? JSON.parse(stored_value) : [];
      setIsLoading(true);
      getPlaylistMetadata(playlist_uris).then(data => {
        setPlaylistData(data);
        setIsLoading(false);
      });
    }
  }, [activeLink]);

  // Updates playlist data when the selected filter option changes.
  useEffect(() => {
    setIsLoading(true);
    const playlist_uris = getPlaylistsTaggedAs(filterQuery.trim().split(' '), selectedFilterOption);
    getPlaylistMetadata(playlist_uris).then(data => {
      setPlaylistData(data);
      setIsLoading(false);
    });
  }, [selectedFilterOption]);

  // Updates playlist data when the filter query changes (debounced).
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
  
  // Updates the filter query when the user types.
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilterQuery(event.target.value);
  };

  // Toggles the shuffle state.
  const toggleShuffle = () => {
    setIsEnabled(!shuffleState);
  };

  // Toggles the input focus state.
  const toggleInputFocus = () => {
    setIsFocused(!inputFocused);
  };

  const handleMouseEnter = () => {
    setInputHovered(true);
  };

  const handleMouseLeave = () => {
    setInputHovered(false);
  };

  // Updates the tag list when a tag is removed from all playlists.
  const updateTagList = () => {
    setTags(getAllTags('A-Z'));
  };

  // Styles the top spacing based on the "Show global nav bar with home button, search input and user avatar" experimental feature value.
  const topSpacingStyle = {
    marginTop: navBarValue !== 'control' ? '60px' : '0px', 
  };

  // Renders different pages based on the active navigation bar tab.
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
                  background-color: var(--background-elevated-base);
                  padding: 5px;
                  border-radius: 9999px;
                  border-width: 0;
                  margin: 0;
                  padding-left: 42px;
                }
                .tag-search-bar:hover {
                  background-color: var(--background-elevated-highlight);
                }
                .tag-search-bar:focus {
                  background-color: var(--background-elevated-highlight);
                  border-color: rgb(255, 255, 255);
                  border-width: 2px;
                  border-style: solid;
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
            <div className="top-spacing" style={topSpacingStyle}></div>
            <div className="input-wrapper">
              <PlayButton onClick={() => {addPlaylistsToQueue(playlistData, shuffleState)}} />
              <ShuffleButton shuffleState={shuffleState} toggleShuffle={toggleShuffle} />
              <div className='search-wrapper'>
                <svg className="icon" width="24" height="24" viewBox="0 0 24 24"
                  dangerouslySetInnerHTML={{ __html: (inputFocused || inputHovered) ? Spicetify.SVGIcons["search-active"] : Spicetify.SVGIcons["search"] }}>
                </svg>
                <input
                  className='tag-search-bar'
                  type="text"
                  placeholder='Enter tags'
                  spellCheck='false'
                  value={filterQuery}
                  onFocus={toggleInputFocus}
                  onBlur={toggleInputFocus}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  onChange={handleSearchChange}/>
              </div>
              <FilterDropdown items={['Match Any Tag (OR)', 'Match All Tags (AND)']} onSelect={(value: string) => { setFilterOption(value) }}></FilterDropdown>
              <SortDropdown items={['Title: A-Z', 'Title: Z-A', 'Description: A-Z', 'Description: Z-A', 'No covers first']} onSelect={(value: string) => { setSortingOption(value) }} selected={selectedSortingOption}/>
            </div>
            <div className='tag-list-wrapper'>
              {
                // Places tags contained in the filter query at the beginning of the list
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
                  const filter_query_terms = filterQuery.split(' ');
                  const last_term_without_exclusion: string = (filter_query_terms[filter_query_terms.length - 1] || '').replace(/!/g, '');
                  if (tag.toLowerCase().includes(last_term_without_exclusion.toLowerCase())) {
                    return (
                      <SpotifyChip
                        // selectedColorSet={filterQuery.split(' ').includes(tag) ? 'positive' : 'negative'}
                        className='tag-list-tag'
                        style={{ 
                          backgroundColor: filterQuery.replace(/!/g, '').split(' ').includes(tag) ? 'var(--spice-selected-row)' : '', 
                        }}
                        onClick={() => {
                          const last_term = filter_query_terms[filter_query_terms.length - 1] || '';
                          const is_excluded = (last_term.startsWith('!'));
                          const tag_with_exclusion = is_excluded ? '!' + tag : tag;
                          const excluded_tag = '!' + tag;
                    
                          switch (true) {
                            // Removes exclusion tag from search
                            case filter_query_terms.includes(excluded_tag):
                              setFilterQuery(removeStringFromStringArray(filter_query_terms, excluded_tag));
                              break;
                            // Removes inclusion tag from search
                            case filter_query_terms.includes(tag):
                              setFilterQuery(removeStringFromStringArray(filter_query_terms, tag));
                              break;
                            // Adds tag to search
                            default:
                              setFilterQuery(filter_query_terms.slice(0, -1).join(' ') + ' ' + tag_with_exclusion + ' ');
                              break;
                          }
                        }}
                        onContextMenu={() => {removeTagFromAllPlaylists(new RegExp(escapeRegExp(tag))); setFilterQuery(removeStringFromStringArray(filter_query_terms, tag)); updateTagList()}}>{/* {tag} */}
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
              <div className="top-spacing" style={topSpacingStyle}></div>
              <div className='tag-list-wrapper'>
                {
                  tagList.map((tag) => (
                    <SpotifyChip
                      className='tag-list-tag'
                      semanticColor='textBase'
                      onClick={() => {
                        if (getCurrentPageURI() !== '') {
                          Spicetify.Platform.History.push('/playlist-tags/' + getCurrentPageURI() + ' ' + tag);
                        } else {
                          Spicetify.Platform.History.push('/playlist-tags/' + tag);
                        }
                        setActiveLink('Search');
                      }}
                      onContextMenu={() => {removeTagFromAllPlaylists(new RegExp(tag)); updateTagList()}}>{tag}
                    </SpotifyChip>
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
          <style>
            {`
              .all-playlists-page-sort-dropdown-wrapper {
                padding-left: calc(50% - 110px);
                padding-bottom: 15px;
              }
            `}
          </style>
          <div className="top-spacing" style={topSpacingStyle}></div>
          <div className='all-playlists-page-sort-dropdown-wrapper'>
            <SortDropdown items={['Title: A-Z', 'Title: Z-A', 'Description: A-Z', 'Description: Z-A', 'No covers first']} onSelect={(value: string) => { setSortingOption(value) }} selected={selectedSortingOption} />
          </div>
          {
            playlistData && renderPlaylists(playlistData, selectedSortingOption, isLoading, filterQuery)
          }
          {navBar}
        </>
      );
    case "README":
      return (
        <>
          <div className="top-spacing" style={topSpacingStyle}></div>
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


/**
 * Higher-order component that handles the initialization of Spicetify.
 * @param WrappedComponent - The component to be wrapped.
 * @returns A new component that handles the Spicetify initialization.
 */
const withSpicetifyInitialization = (WrappedComponent: React.FC) => {
  return () => {
    const [isReady, setIsReady] = useState(false);

    // Initializes Spicetify and waits for required dependencies to be ready.
    useEffect(() => {
      const initializeSpicetify = async () => {
        await waitForSpicetify();
        await waitForPlatformApi('History');
        setIsReady(true);
      };
      initializeSpicetify();
    }, []);

    // Renders a loading message when Spicetify is not ready.
    if (!isReady) {
      return (
        <h1 style={{ textAlign: 'center' }}>
          Loading...
        </h1>
      );
    }

    // Renders the wrapped component when Spicetify is ready.
    return <WrappedComponent/>;
  };
};

export default withSpicetifyInitialization(App);
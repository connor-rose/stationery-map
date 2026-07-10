import { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import StationeryIcon from './assets/Default.png';
import { stores } from './data/stores';
import type { StationeryStore, CountryGroup, StateGroup } from './types/store';
import { formatStoreHoursHtml } from './utils/formatStoreHours';

// You'll need to replace this with your Mapbox access token
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
mapboxgl.accessToken = MAPBOX_TOKEN;

// iOS system colors
const lightColors = {
  background: '#F2F2F7', // iOS system background
  card: '#FFFFFF',
  text: '#000000',
  secondaryText: '#6C6C70',
  accent: '#007AFF', // iOS blue
  border: '#C6C6C8',
  shadow: 'rgba(0, 0, 0, 0.1)'
};

const darkColors = {
  background: '#000000',
  card: '#1C1C1E',
  text: '#FFFFFF',
  secondaryText: '#8E8E93',
  accent: '#0A84FF',
  border: '#38383A',
  shadow: 'rgba(0, 0, 0, 0.3)'
};

function App() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [lng] = useState(-122.4194);
  const [lat] = useState(37.7749);
  const [zoom] = useState(12);
  const [mapError, setMapError] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [expandedCountries, setExpandedCountries] = useState<{ [key: string]: boolean }>(() => {
    const groups: { [key: string]: CountryGroup } = {};
    stores.forEach(store => {
      const country = store.country || 'United States';
      if (!groups[country]) {
        groups[country] = {
          name: country,
          isExpanded: false,
          states: {}
        };
      }
    });
    const firstCountry = Object.keys(groups)[0];
    return firstCountry ? { [firstCountry]: true } : {};
  });
  const [expandedStates, setExpandedStates] = useState<{ [key: string]: boolean }>({});
  const [isMobile] = useState(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  });
  const [isListOpen, setIsListOpen] = useState(false);

  // Update colors based on mode
  const colors = isDarkMode ? darkColors : lightColors;

  // Group stores by country and state
  const groupedStores = useMemo<{ [key: string]: CountryGroup }>(() => {
    const groups: { [key: string]: CountryGroup } = {};
    
    // First sort all stores by name
    const sortedStores = [...stores].sort((a, b) => a.name.localeCompare(b.name));
    
    sortedStores.forEach(store => {
      const country = store.country || 'United States';
      const state = store.state || 'Unknown';
      
      if (!groups[country]) {
        groups[country] = {
          name: country,
          isExpanded: expandedCountries[country] || false,
          states: {}
        };
      }
      
      if (!groups[country].states[state]) {
        groups[country].states[state] = {
          name: state,
          isExpanded: expandedStates[state] || false,
          stores: []
        };
      }
      
      groups[country].states[state].stores.push(store);
    });
    
    // Sort countries alphabetically
    const sortedGroups: { [key: string]: CountryGroup } = {};
    Object.keys(groups)
      .sort((a, b) => a.localeCompare(b))
      .forEach(country => {
        // Sort states within each country
        const sortedStates: { [key: string]: StateGroup } = {};
        Object.keys(groups[country].states)
          .sort((a, b) => a.localeCompare(b))
          .forEach(state => {
            // States are already sorted by store name from the initial sort
            sortedStates[state] = groups[country].states[state];
          });
        
        sortedGroups[country] = {
          ...groups[country],
          states: sortedStates
        };
      });
    
    return sortedGroups;
  }, [stores, expandedCountries, expandedStates]);

  // Filter stores based on search query with proper typing
  const filteredGroups = useMemo<{ [key: string]: CountryGroup }>(() => {
    if (!searchQuery) return groupedStores;
    
    const filtered: { [key: string]: CountryGroup } = {};
    
    Object.entries(groupedStores).forEach(([countryName, country]) => {
      const filteredStates: { [key: string]: StateGroup } = {};
      
      Object.entries(country.states).forEach(([stateName, state]) => {
        const filteredStores = state.stores.filter(store => 
          store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          store.address.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        if (filteredStores.length > 0) {
          filteredStates[stateName] = {
            ...state,
            stores: filteredStores.sort((a, b) => a.name.localeCompare(b.name))
          };
        }
      });
      
      if (Object.keys(filteredStates).length > 0) {
        filtered[countryName] = {
          ...country,
          states: filteredStates
        };
      }
    });
    
    return filtered;
  }, [groupedStores, searchQuery]);

  useEffect(() => {
    if (!map.current && mapContainer.current) {
      try {
        console.log('Initializing map with token:', MAPBOX_TOKEN);
        
        // Ensure the map container has dimensions
        const container = mapContainer.current;
        if (container.offsetHeight === 0) {
          container.style.height = '100%';
          container.style.width = '100%';
        }
        
        // Initialize the map
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: isDarkMode ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/streets-v12',
          center: [lng, lat],
          zoom: zoom,
          attributionControl: true
        });

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

        // Handle map load
        map.current.on('load', () => {
          console.log('Map loaded successfully');
          setMapError(null);
          
          // Clear existing markers
          markers.current.forEach(marker => marker.remove());
          markers.current = [];

          // Add markers for each store
          stores.forEach(store => {
            const popup = new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <div style="padding: 12px;">
                  <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #000000;">${store.name}</h3>
                  <p style="margin: 0 0 12px 0; font-size: 14px; color: #000000;">${store.address}</p>
                  ${store.hours ? `
                    <div style="margin: 0 0 12px 0; font-size: 14px; color: #000000;">
                      ${formatStoreHoursHtml(store.hours)}
                    </div>
                  ` : ''}
                  ${store.website ? `
                    <a href="${store.website}" 
                       target="_blank" 
                       style="
                         color: #FFFFFF;
                         text-decoration: none;
                         font-size: 14px;
                         display: inline-block;
                         background-color: #007AFF;
                         padding: 8px 12px;
                         border-radius: 6px;
                       "
                    >Visit Website</a>
                  ` : ''}
                </div>
              `);

            const marker = new mapboxgl.Marker({
              color: '#FF9500'
            })
              .setLngLat([store.longitude, store.latitude])
              .setPopup(popup)
              .addTo(map.current!);

            markers.current.push(marker);
          });
        });

        // Handle map errors
        map.current.on('error', (e) => {
          console.error('Mapbox error:', e);
          setMapError('Error loading map. Please try refreshing the page.');
        });

      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError('Failed to initialize map. Please check your connection and try again.');
      }
    }

    // Update map style when dark mode changes
    if (map.current) {
      map.current.setStyle(isDarkMode ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/streets-v12');
    }

    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [lng, lat, zoom, isDarkMode]);

  const handleStoreClick = (store: StationeryStore) => {
    if (map.current) {
      map.current.flyTo({
        center: [store.longitude, store.latitude],
        zoom: 15,
        duration: 1000
      });

      const marker = markers.current.find(m => 
        m.getLngLat().lng === store.longitude && 
        m.getLngLat().lat === store.latitude
      );
      if (marker) {
        marker.togglePopup();
      }

      setSelectedStore(store.id);
      if (isMobile) {
        setIsListOpen(false);
      }
    }
  };

  const handleCountryClick = (countryName: string) => {
    setExpandedCountries(prev => ({
      ...prev,
      [countryName]: !prev[countryName]
    }));
  };

  const handleStateClick = (stateName: string) => {
    setExpandedStates(prev => ({
      ...prev,
      [stateName]: !prev[stateName]
    }));
  };

  // Force focus on mobile when list is open
  useEffect(() => {
    if (isMobile && isListOpen && !isInputFocused) {
      const timer = setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          setIsInputFocused(true);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isMobile, isListOpen, isInputFocused]);

  // Handle focus management
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: colors.background,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: colors.text,
      transition: 'background-color 0.3s ease'
    }}>
      <header style={{ 
        padding: '1rem',
        backgroundColor: colors.card,
        borderBottom: `1px solid ${colors.border}`,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        transition: 'background-color 0.3s ease, border-color 0.3s ease'
      }}>
        <div style={{ 
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
          padding: '0 1rem',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: isMobile ? '12px' : '0'
        }}>
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center'
          }}>
            <img
              src={StationeryIcon}
              alt="Stationery Icon"
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                marginRight: 16,
                background: 'white',
                boxShadow: `0 2px 8px ${colors.shadow}`
              }}
            />
            <div>
              <h1 style={{ 
                fontSize: '24px',
                fontWeight: '700',
                color: colors.text,
                margin: 0,
                textAlign: 'left',
                whiteSpace: 'nowrap'
              }}>Stationery Store Map</h1>
              <p style={{
                fontSize: '15px',
                color: colors.secondaryText,
                margin: '4px 0 0 0',
                textAlign: 'left'
              }}>
                Powered by{' '}
                <a 
                  href="https://www.penedex.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    color: '#FF9500',
                    textDecoration: 'none',
                    fontWeight: '600'
                  }}
                >
                  Penedex
                </a>
              </p>
            </div>
          </div>
          <div style={{
            width: isMobile ? '100%' : '400px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isMobile ? 'space-between' : 'flex-end',
            gap: '12px',
            position: 'relative',
            marginLeft: isMobile ? '0' : 'auto',
            marginRight: isMobile ? '0' : 'auto'
          }}>
            <div style={{
              display: 'flex',
              gap: '12px',
              flex: 1,
              justifyContent: isMobile ? 'center' : 'flex-end'
            }}>
              {isMobile && (
                <button
                  onClick={() => setIsListOpen(true)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: colors.text,
                    fontSize: '15px',
                    fontWeight: '500',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                    flex: 1,
                    textAlign: 'center'
                  }}
                >
                  Show List
                </button>
              )}
              <button
                onClick={() => window.location.href = 'mailto:hello@penedex.com?subject=New Stationery Store Submission'}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: colors.text,
                  fontSize: '15px',
                  fontWeight: '500',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                  flex: isMobile ? 1 : 'none',
                  textAlign: 'center'
                }}
              >
                Submit Store Info
              </button>
            </div>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: colors.text,
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                padding: 0,
                marginLeft: '24px'
              }}
            >
              {isDarkMode ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <main style={{ 
        flex: 1,
        padding: isMobile ? '0' : '1rem',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        gap: '1rem',
        height: isMobile ? 'calc(100vh - 80px)' : 'calc(100vh - 80px)',
        position: 'relative'
      }}>
        {/* Map always visible on mobile; list is overlay. On desktop, both visible. */}
        <div style={{
          flex: 1.5,
          position: 'relative',
          backgroundColor: colors.card,
          borderRadius: isMobile ? '0' : '10px',
          boxShadow: isMobile ? 'none' : `0 2px 8px ${colors.shadow}`,
          overflow: 'hidden',
          height: '100%',
          width: '100%',
          transition: 'background-color 0.3s ease, box-shadow 0.3s ease'
        }}>
          {mapError ? (
            <div style={{ 
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
              color: '#FF3B30',
              padding: '1rem',
              borderRadius: '10px',
              fontSize: '15px'
            }}>
              <strong>Error: </strong>
              <span>{mapError}</span>
            </div>
          ) : (
            <div 
              ref={mapContainer} 
              style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
                minHeight: '300px'
              }} 
            />
          )}
        </div>

        {/* Mobile List Overlay */}
        {isMobile && isListOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.background,
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              padding: '1rem',
              borderBottom: `1px solid ${colors.border}`,
              backgroundColor: colors.card,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{
                fontSize: '17px',
                fontWeight: '600',
                margin: 0,
                color: colors.text
              }}>Stores</h2>
              <button
                onClick={() => setIsListOpen(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: colors.text,
                  padding: '8px',
                  cursor: 'pointer'
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div style={{
              padding: '1rem',
              borderBottom: `1px solid ${colors.border}`,
              backgroundColor: colors.card
            }}>
              <div style={{ position: 'relative' }}>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search stores..."
                  value={searchQuery}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    paddingLeft: '32px',
                    borderRadius: '8px',
                    border: `1px solid ${colors.border}`,
                    backgroundColor: colors.background,
                    color: colors.text,
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                />
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={colors.secondaryText}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none'
                  }}
                >
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
            </div>
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '0.5rem',
              backgroundColor: colors.background
            }}>
              {Object.entries(filteredGroups).map(([countryName, country]) => (
                <div key={countryName} style={{ marginBottom: '16px' }}>
                  <button
                    onClick={() => handleCountryClick(countryName)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      color: colors.text,
                      transition: 'background-color 0.2s ease',
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <h3 style={{
                      fontSize: '17px',
                      fontWeight: '600',
                      margin: 0,
                      color: colors.text,
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {countryName}
                      <span style={{
                        fontSize: '13px',
                        fontWeight: '500',
                        color: colors.secondaryText,
                        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                        padding: '2px 6px',
                        borderRadius: '12px'
                      }}>
                        {Object.values(country.states).reduce((acc, state) => acc + state.stores.length, 0)}
                      </span>
                    </h3>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={colors.text}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        transform: expandedCountries[countryName] ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease'
                      }}
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                  {expandedCountries[countryName] && Object.entries(country.states).map(([stateName, state]) => (
                    <div key={stateName} style={{ marginLeft: '12px', marginTop: '8px' }}>
                      <button
                        onClick={() => handleStateClick(stateName)}
                        style={{
                          width: '100%',
                          padding: '6px 12px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          color: colors.text,
                          transition: 'background-color 0.2s ease',
                        }}
                        onMouseOver={e => {
                          e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <h4 style={{
                          fontSize: '15px',
                          fontWeight: '500',
                          margin: 0,
                          color: colors.text,
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          {stateName}
                          <span style={{
                            fontSize: '12px',
                            fontWeight: '500',
                            color: colors.secondaryText,
                            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                            padding: '1px 5px',
                            borderRadius: '10px'
                          }}>
                            {state.stores.length}
                          </span>
                        </h4>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke={colors.text}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{
                            transform: expandedStates[stateName] ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease'
                          }}
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                      {expandedStates[stateName] && (
                        <div style={{ marginLeft: '12px', marginTop: '4px' }}>
                          {state.stores.map(store => (
                            <button
                              key={store.id}
                              onClick={() => handleStoreClick(store)}
                              style={{
                                width: '100%',
                                padding: '12px',
                                marginBottom: '8px',
                                backgroundColor: selectedStore === store.id ? '#FF9500' : 'transparent',
                                border: 'none',
                                borderRadius: '8px',
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s ease',
                                color: selectedStore === store.id ? '#FFFFFF' : colors.text
                              }}
                            >
                              <div style={{
                                fontSize: '15px',
                                fontWeight: '600',
                                marginBottom: '4px'
                              }}>
                                {store.name}
                              </div>
                              <div style={{
                                fontSize: '13px',
                                color: selectedStore === store.id ? 'rgba(255, 255, 255, 0.8)' : colors.secondaryText
                              }}>
                                {store.address}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Desktop: list always visible. Mobile: list is overlay. */}
        {!isMobile && (
          <div style={{
            width: '280px',
            backgroundColor: colors.card,
            borderRadius: '10px',
            boxShadow: `0 2px 8px ${colors.shadow}`,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
            height: '100%'
          }}>
            {/* --- List UI from above --- */}
            <div style={{
              padding: '1rem',
              borderBottom: `1px solid ${colors.border}`,
              backgroundColor: colors.card,
              flexShrink: 0
            }}>
              <h2 style={{
                fontSize: '17px',
                fontWeight: '600',
                margin: '0 0 12px 0',
                color: colors.text
              }}>Stores</h2>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search stores..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    paddingLeft: '32px',
                    borderRadius: '8px',
                    border: `1px solid ${colors.border}`,
                    backgroundColor: colors.background,
                    color: colors.text,
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                />
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={colors.secondaryText}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none'
                  }}
                >
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
            </div>
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '0.5rem',
              minHeight: 0
            }}>
              {Object.entries(filteredGroups).map(([countryName, country]) => (
                <div key={countryName} style={{ marginBottom: '16px' }}>
                  <button
                    onClick={() => handleCountryClick(countryName)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      color: colors.text,
                      transition: 'background-color 0.2s ease',
                    }}
                    onMouseOver={e => {
                      e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                    }}
                    onMouseOut={e => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <h3 style={{
                      fontSize: '17px',
                      fontWeight: '600',
                      margin: 0,
                      color: colors.text,
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {countryName}
                      <span style={{
                        fontSize: '13px',
                        fontWeight: '500',
                        color: colors.secondaryText,
                        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                        padding: '2px 6px',
                        borderRadius: '12px'
                      }}>
                        {Object.values(country.states).reduce((acc, state) => acc + state.stores.length, 0)}
                      </span>
                    </h3>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={colors.text}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        transform: expandedCountries[countryName] ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease'
                      }}
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                  {expandedCountries[countryName] && Object.entries(country.states).map(([stateName, state]) => (
                    <div key={stateName} style={{ marginLeft: '12px', marginTop: '8px' }}>
                      <button
                        onClick={() => handleStateClick(stateName)}
                        style={{
                          width: '100%',
                          padding: '6px 12px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          color: colors.text,
                          transition: 'background-color 0.2s ease',
                        }}
                        onMouseOver={e => {
                          e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <h4 style={{
                          fontSize: '15px',
                          fontWeight: '500',
                          margin: 0,
                          color: colors.text,
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          {stateName}
                          <span style={{
                            fontSize: '12px',
                            fontWeight: '500',
                            color: colors.secondaryText,
                            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                            padding: '1px 5px',
                            borderRadius: '10px'
                          }}>
                            {state.stores.length}
                          </span>
                        </h4>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke={colors.text}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{
                            transform: expandedStates[stateName] ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s ease'
                          }}
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                      {expandedStates[stateName] && (
                        <div style={{ marginLeft: '12px', marginTop: '4px' }}>
                          {state.stores.map(store => (
                            <button
                              key={store.id}
                              onClick={() => handleStoreClick(store)}
                              style={{
                                width: '100%',
                                padding: '12px',
                                marginBottom: '8px',
                                backgroundColor: selectedStore === store.id ? '#FF9500' : 'transparent',
                                border: 'none',
                                borderRadius: '8px',
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s ease',
                                color: selectedStore === store.id ? '#FFFFFF' : colors.text
                              }}
                            >
                              <div style={{
                                fontSize: '15px',
                                fontWeight: '600',
                                marginBottom: '4px'
                              }}>
                                {store.name}
                              </div>
                              <div style={{
                                fontSize: '13px',
                                color: selectedStore === store.id ? 'rgba(255, 255, 255, 0.8)' : colors.secondaryText
                              }}>
                                {store.address}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

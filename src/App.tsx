import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import StationeryIcon from './assets/Default.png';
import { stores } from './data/stores';
import type { StationeryStore, CountryGroup, StateGroup } from './types/store';
import { formatStoreHoursHtml } from './utils/formatStoreHours';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
mapboxgl.accessToken = MAPBOX_TOKEN;

const LAST_UPDATED = 'July 2026';
const SOURCE_ID = 'stores';
const SELECTED_SOURCE_ID = 'selected-store';
const USER_LOCATION_SOURCE_ID = 'user-location';
const SUBMIT_STORE_FORM_URL = 'https://inkspots.notion.site/29ec01da38f64c30829800d5012ba45c?pvs=105';

const lightColors = {
  background: '#F4F1EC',
  card: '#FFFFFF',
  panel: 'rgba(255, 255, 255, 0.94)',
  text: '#201A16',
  secondaryText: '#71675F',
  mutedText: '#91877E',
  accent: '#D97706',
  accentStrong: '#B45309',
  accentSoft: '#FFF4E2',
  border: '#DED7CE',
  borderStrong: '#CDBFAF',
  mapOverlay: 'rgba(255, 255, 255, 0.9)',
  shadow: 'rgba(67, 45, 25, 0.14)'
};

const darkColors = {
  background: '#11100F',
  card: '#1D1B19',
  panel: 'rgba(29, 27, 25, 0.94)',
  text: '#F8F3EA',
  secondaryText: '#B8ADA1',
  mutedText: '#8F8378',
  accent: '#F59E0B',
  accentStrong: '#FBBF24',
  accentSoft: 'rgba(245, 158, 11, 0.16)',
  border: '#3B342D',
  borderStrong: '#584A3F',
  mapOverlay: 'rgba(29, 27, 25, 0.9)',
  shadow: 'rgba(0, 0, 0, 0.36)'
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const storeSlug = (store: StationeryStore) => {
  const base = slugify(store.name);
  const duplicateNames = stores.filter(candidate => slugify(candidate.name) === base);
  return duplicateNames.length > 1 ? `${base}-${store.id}` : base;
};

const storeMapsUrl = (store: StationeryStore) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${store.name} ${store.address}`)}`;

const normalizeWebsite = (website?: string) => {
  if (!website) return undefined;
  return website.startsWith('http') ? website : `https://${website}`;
};

function App() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [lng] = useState(-122.4194);
  const [lat] = useState(37.7749);
  const [zoom] = useState(12);
  const [mapError, setMapError] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const storeParam = params.get('store');
    if (!storeParam) return null;
    return stores.find(store => storeSlug(store) === storeParam || store.id === storeParam)?.id ?? null;
  });
  const [searchQuery, setSearchQuery] = useState('');
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
    const firstCountry = Object.keys(groups).sort((a, b) => a.localeCompare(b))[0];
    return firstCountry ? { [firstCountry]: true } : {};
  });
  const [expandedStates, setExpandedStates] = useState<{ [key: string]: boolean }>({});
  const [isMobileListOpen, setIsMobileListOpen] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const colors = isDarkMode ? darkColors : lightColors;
  const selectedStoreData = useMemo(
    () => stores.find(store => store.id === selectedStore) ?? null,
    [selectedStore]
  );

  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 760px)').matches;

  const groupedStores = useMemo<{ [key: string]: CountryGroup }>(() => {
    const groups: { [key: string]: CountryGroup } = {};
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

    const sortedGroups: { [key: string]: CountryGroup } = {};
    Object.keys(groups)
      .sort((a, b) => a.localeCompare(b))
      .forEach(country => {
        const sortedStates: { [key: string]: StateGroup } = {};
        Object.keys(groups[country].states)
          .sort((a, b) => a.localeCompare(b))
          .forEach(state => {
            sortedStates[state] = groups[country].states[state];
          });

        sortedGroups[country] = {
          ...groups[country],
          states: sortedStates
        };
      });

    return sortedGroups;
  }, [expandedCountries, expandedStates]);

  const filteredGroups = useMemo<{ [key: string]: CountryGroup }>(() => {
    if (!searchQuery) return groupedStores;

    const filtered: { [key: string]: CountryGroup } = {};
    const normalizedQuery = searchQuery.toLowerCase();

    Object.entries(groupedStores).forEach(([countryName, country]) => {
      const filteredStates: { [key: string]: StateGroup } = {};

      Object.entries(country.states).forEach(([stateName, state]) => {
        const filteredStores = state.stores.filter(store =>
          [
            store.name,
            store.address,
            store.state,
            store.country,
            store.website,
            store.phone
          ]
            .filter(Boolean)
            .some(value => value!.toLowerCase().includes(normalizedQuery))
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

  const visibleStores = useMemo(
    () =>
      Object.values(filteredGroups).flatMap(country =>
        Object.values(country.states).flatMap(state => state.stores)
      ),
    [filteredGroups]
  );

  const storeFeatures = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: visibleStores.map(store => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [store.longitude, store.latitude]
        },
        properties: {
          id: store.id,
          name: store.name,
          address: store.address,
          state: store.state,
          country: store.country
        }
      }))
    }),
    [visibleStores]
  );

  const updateUrlForStore = useCallback((store: StationeryStore | null) => {
    const url = new URL(window.location.href);
    if (store) {
      url.searchParams.set('store', storeSlug(store));
    } else {
      url.searchParams.delete('store');
    }
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }, []);

  const selectStore = useCallback(
    (store: StationeryStore, shouldFly = true) => {
      setSelectedStore(store.id);
      updateUrlForStore(store);
      if (shouldFly && map.current) {
        map.current.flyTo({
          center: [store.longitude, store.latitude],
          zoom: Math.max(map.current.getZoom(), 14),
          duration: 900
        });
      }
      if (isMobile) {
        setIsMobileListOpen(false);
      }
    },
    [isMobile, updateUrlForStore]
  );

  const clearSelection = () => {
    setSelectedStore(null);
    updateUrlForStore(null);
  };

  const upsertSelectedStoreSource = useCallback(() => {
    const currentMap = map.current;
    if (!currentMap || !currentMap.isStyleLoaded()) return;

    const selected = stores.find(store => store.id === selectedStore);
    const data = {
      type: 'FeatureCollection' as const,
      features: selected
        ? [
            {
              type: 'Feature' as const,
              geometry: {
                type: 'Point' as const,
                coordinates: [selected.longitude, selected.latitude]
              },
              properties: { id: selected.id }
            }
          ]
        : []
    };

    const source = currentMap.getSource(SELECTED_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (source) {
      source.setData(data);
      return;
    }

    currentMap.addSource(SELECTED_SOURCE_ID, {
      type: 'geojson',
      data
    });

    currentMap.addLayer({
      id: 'selected-store-halo',
      type: 'circle',
      source: SELECTED_SOURCE_ID,
      paint: {
        'circle-radius': 18,
        'circle-color': colors.accent,
        'circle-opacity': 0.2,
        'circle-stroke-color': colors.accent,
        'circle-stroke-width': 2
      }
    });
  }, [colors.accent, selectedStore]);

  const addStoreLayers = useCallback(() => {
    const currentMap = map.current;
    if (!currentMap || !currentMap.isStyleLoaded()) return;

    if (!currentMap.getSource(SOURCE_ID)) {
      currentMap.addSource(SOURCE_ID, {
        type: 'geojson',
        data: storeFeatures,
        cluster: true,
        clusterMaxZoom: 12,
        clusterRadius: 48
      });
    }

    if (!currentMap.getLayer('clusters')) {
      currentMap.addLayer({
        id: 'clusters',
        type: 'circle',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            colors.accent,
            12,
            colors.accentStrong,
            40,
            '#7C2D12'
          ],
          'circle-radius': ['step', ['get', 'point_count'], 18, 12, 24, 40, 32],
          'circle-stroke-color': isDarkMode ? '#1D1B19' : '#FFFFFF',
          'circle-stroke-width': 3
        }
      });
    }

    if (!currentMap.getLayer('cluster-count')) {
      currentMap.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12
        },
        paint: {
          'text-color': '#FFFFFF'
        }
      });
    }

    if (!currentMap.getLayer('unclustered-point')) {
      currentMap.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: SOURCE_ID,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': colors.accent,
          'circle-radius': 8,
          'circle-stroke-color': isDarkMode ? '#1D1B19' : '#FFFFFF',
          'circle-stroke-width': 2
        }
      });
    }

    if (!currentMap.getLayer('unclustered-point-inner')) {
      currentMap.addLayer({
        id: 'unclustered-point-inner',
        type: 'circle',
        source: SOURCE_ID,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#FFFFFF',
          'circle-radius': 2.5
        }
      });
    }

    upsertSelectedStoreSource();
  }, [colors.accent, colors.accentStrong, isDarkMode, storeFeatures, upsertSelectedStoreSource]);

  useEffect(() => {
    const currentMap = map.current;
    const source = currentMap?.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (source) {
      source.setData(storeFeatures);
    }
  }, [storeFeatures]);

  useEffect(() => {
    upsertSelectedStoreSource();
  }, [upsertSelectedStoreSource]);

  useEffect(() => {
    if (!map.current && mapContainer.current) {
      try {
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: isDarkMode ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/streets-v12',
          center: [lng, lat],
          zoom,
          attributionControl: true
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

        map.current.on('load', () => {
          map.current?.resize();
          addStoreLayers();
          setMapError(null);
        });

        map.current.on('style.load', () => {
          addStoreLayers();
          map.current?.resize();
        });

        map.current.on('click', 'clusters', event => {
          const feature = event.features?.[0];
          if (!feature) return;
          const clusterId = feature.properties?.cluster_id;
          const source = map.current?.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
          source?.getClusterExpansionZoom(clusterId, (error, expansionZoom) => {
            if (error || expansionZoom == null || !feature.geometry || feature.geometry.type !== 'Point') return;
            map.current?.easeTo({
              center: feature.geometry.coordinates as [number, number],
              zoom: expansionZoom,
              duration: 500
            });
          });
        });

        map.current.on('click', 'unclustered-point', event => {
          const storeId = event.features?.[0]?.properties?.id;
          const store = stores.find(candidate => candidate.id === storeId);
          if (store) {
            selectStore(store, false);
          }
        });

        map.current.on('mouseenter', 'clusters', () => {
          if (map.current) map.current.getCanvas().style.cursor = 'pointer';
        });

        map.current.on('mouseleave', 'clusters', () => {
          if (map.current) map.current.getCanvas().style.cursor = '';
        });

        map.current.on('mouseenter', 'unclustered-point', () => {
          if (map.current) map.current.getCanvas().style.cursor = 'pointer';
        });

        map.current.on('mouseleave', 'unclustered-point', () => {
          if (map.current) map.current.getCanvas().style.cursor = '';
        });

        map.current.on('error', event => {
          console.error('Mapbox error:', event);
          setMapError('Error loading map. Please try refreshing the page.');
        });
      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError('Failed to initialize map. Please check your connection and try again.');
      }
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [lat, lng, zoom]);

  useEffect(() => {
    if (map.current) {
      map.current.resize();
      map.current.setStyle(isDarkMode ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/streets-v12');
    }
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    if (selectedStoreData && map.current) {
      map.current.flyTo({
        center: [selectedStoreData.longitude, selectedStoreData.latitude],
        zoom: Math.max(map.current.getZoom(), 13),
        duration: 700
      });
    }
  }, []);

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

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setLocationError('Location is not available in this browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      position => {
        const coordinates: [number, number] = [position.coords.longitude, position.coords.latitude];
        const currentMap = map.current;
        if (currentMap) {
          const data = {
            type: 'FeatureCollection' as const,
            features: [
              {
                type: 'Feature' as const,
                geometry: { type: 'Point' as const, coordinates },
                properties: {}
              }
            ]
          };
          const source = currentMap.getSource(USER_LOCATION_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
          if (source) {
            source.setData(data);
          } else {
            currentMap.addSource(USER_LOCATION_SOURCE_ID, { type: 'geojson', data });
            currentMap.addLayer({
              id: 'user-location',
              type: 'circle',
              source: USER_LOCATION_SOURCE_ID,
              paint: {
                'circle-radius': 8,
                'circle-color': '#2563EB',
                'circle-stroke-color': '#FFFFFF',
                'circle-stroke-width': 3
              }
            });
          }
          currentMap.flyTo({ center: coordinates, zoom: 12, duration: 900 });
        }
        setIsLocating(false);
      },
      () => {
        setLocationError('Location permission was not granted.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const renderSearch = (autoFocus = false) => (
    <div style={{ position: 'relative' }}>
      <input
        autoFocus={autoFocus}
        type="text"
        placeholder="Search stores, cities, countries..."
        value={searchQuery}
        onChange={event => setSearchQuery(event.target.value)}
        style={{
          width: '100%',
          padding: '11px 12px',
          paddingLeft: '36px',
          borderRadius: '8px',
          border: `1px solid ${colors.border}`,
          backgroundColor: isDarkMode ? '#11100F' : '#FBFAF7',
          color: colors.text,
          fontSize: '14px',
          outline: 'none',
          boxSizing: 'border-box'
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
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none'
        }}
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    </div>
  );

  const renderStoreList = (compact = false) => (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        minHeight: 0,
        padding: compact ? '8px 12px 96px' : '8px 10px 16px'
      }}
    >
      {Object.entries(filteredGroups).map(([countryName, country]) => {
        const countryCount = Object.values(country.states).reduce((acc, state) => acc + state.stores.length, 0);
        return (
          <div key={countryName} style={{ marginBottom: '10px' }}>
            <button
              onClick={() => handleCountryClick(countryName)}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: expandedCountries[countryName] ? colors.accentSoft : 'transparent',
                border: `1px solid ${expandedCountries[countryName] ? colors.borderStrong : 'transparent'}`,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                color: colors.text,
                boxSizing: 'border-box'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', minWidth: 0, gap: '9px' }}>
                <span
                  style={{
                    width: '6px',
                    height: '22px',
                    borderRadius: '999px',
                    backgroundColor: expandedCountries[countryName] ? colors.accent : colors.borderStrong,
                    flexShrink: 0
                  }}
                />
                <span
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {countryName}
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: colors.secondaryText,
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(32, 26, 22, 0.07)',
                    padding: '2px 7px',
                    borderRadius: '999px'
                  }}
                >
                  {countryCount}
                </span>
              </span>
              <Chevron expanded={!!expandedCountries[countryName]} color={colors.secondaryText} size={16} />
            </button>

            {expandedCountries[countryName] &&
              Object.entries(country.states).map(([stateName, state]) => (
                <div key={stateName} style={{ marginLeft: '16px', marginTop: '8px' }}>
                  <button
                    onClick={() => handleStateClick(stateName)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      backgroundColor: expandedStates[stateName] ? (isDarkMode ? 'rgba(255,255,255,0.06)' : '#FBFAF7') : 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      color: colors.text,
                      boxSizing: 'border-box'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: colors.secondaryText,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {stateName}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: colors.mutedText
                        }}
                      >
                        {state.stores.length}
                      </span>
                    </span>
                    <Chevron expanded={!!expandedStates[stateName]} color={colors.mutedText} size={14} />
                  </button>

                  {expandedStates[stateName] && (
                    <div style={{ marginTop: '6px' }}>
                      {state.stores.map(store => {
                        const isSelected = selectedStore === store.id;
                        return (
                          <button
                            key={store.id}
                            onClick={() => selectStore(store)}
                            style={{
                              width: '100%',
                              padding: '11px 12px',
                              marginBottom: '6px',
                              backgroundColor: isSelected ? colors.accent : 'transparent',
                              border: `1px solid ${isSelected ? colors.accent : colors.border}`,
                              borderRadius: '8px',
                              textAlign: 'left',
                              cursor: 'pointer',
                              color: isSelected ? '#FFFFFF' : colors.text,
                              boxSizing: 'border-box'
                            }}
                          >
                            <div
                              style={{
                                fontSize: '14px',
                                fontWeight: 700,
                                marginBottom: '4px',
                                lineHeight: 1.25
                              }}
                            >
                              {store.name}
                            </div>
                            <div
                              style={{
                                fontSize: '12px',
                                lineHeight: 1.35,
                                color: isSelected ? 'rgba(255, 255, 255, 0.82)' : colors.secondaryText
                              }}
                            >
                              {store.address}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
          </div>
        );
      })}
    </div>
  );

  const renderSelectedStorePanel = () => {
    if (!selectedStoreData) return null;
    const website = normalizeWebsite(selectedStoreData.website);

    return (
      <div
        style={{
          position: 'absolute',
          left: isMobile ? '12px' : '50%',
          right: isMobile ? '12px' : 'auto',
          top: isMobile ? 'auto' : '50%',
          bottom: isMobile ? (isMobileListOpen ? 'calc(72vh + 12px)' : '18px') : 'auto',
          width: isMobile ? 'auto' : 'min(380px, calc(100% - 32px))',
          transform: isMobile ? 'none' : 'translate(-50%, -50%)',
          backgroundColor: colors.panel,
          border: `1px solid ${colors.border}`,
          borderRadius: '8px',
          boxShadow: `0 18px 40px ${colors.shadow}`,
          padding: '16px',
          zIndex: 7,
          backdropFilter: 'blur(16px)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <div
              style={{
                color: colors.accent,
                fontSize: '12px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                marginBottom: '6px'
              }}
            >
              Selected Store
            </div>
            <h2 style={{ margin: 0, color: colors.text, fontSize: '20px', lineHeight: 1.15 }}>
              {selectedStoreData.name}
            </h2>
          </div>
          <button
            onClick={clearSelection}
            aria-label="Close selected store"
            style={{
              border: 'none',
              backgroundColor: 'transparent',
              color: colors.secondaryText,
              padding: '4px',
              cursor: 'pointer'
            }}
          >
            <CloseIcon />
          </button>
        </div>
        <p style={{ color: colors.secondaryText, fontSize: '14px', lineHeight: 1.45, margin: '12px 0' }}>
          {selectedStoreData.address}
        </p>
        {selectedStoreData.phone && (
          <p style={{ color: colors.secondaryText, fontSize: '14px', margin: '0 0 12px' }}>
            {selectedStoreData.phone}
          </p>
        )}
        {selectedStoreData.hours && (
          <div
            style={{
              color: colors.secondaryText,
              fontSize: '13px',
              lineHeight: 1.45,
              marginBottom: '14px'
            }}
            dangerouslySetInnerHTML={{ __html: formatStoreHoursHtml(selectedStoreData.hours) }}
          />
        )}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <a
            href={storeMapsUrl(selectedStoreData)}
            target="_blank"
            rel="noopener noreferrer"
            style={actionLinkStyle(colors.accent, '#FFFFFF')}
          >
            Open in Maps
          </a>
          {website && (
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              style={actionLinkStyle(isDarkMode ? '#2A2622' : '#FFFFFF', colors.text, colors.border)}
            >
              Website
            </a>
          )}
        </div>
      </div>
    );
  };

  const renderFloatingStorePanel = () => (
    <div
      style={{
        position: isMobile ? 'fixed' : 'absolute',
        top: isMobile ? 'auto' : '14px',
        right: isMobile ? 0 : '14px',
        bottom: isMobile ? 0 : '14px',
        width: isMobile ? '100%' : '386px',
        height: isMobile ? '72vh' : 'auto',
        transform: isMobile && !isMobileListOpen ? 'translateY(calc(100% + 18px))' : 'translateY(0)',
        transition: isMobile ? 'transform 0.24s ease' : undefined,
        zIndex: isMobile ? 30 : 6,
        display: 'flex',
        pointerEvents: 'auto'
      }}
    >
      <section
        style={{
          width: '100%',
          height: '100%',
          background: glassBackground(colors, isDarkMode),
          border: `1px solid ${colors.border}`,
          borderRadius: isMobile ? '14px 14px 0 0' : '10px',
          boxShadow: isMobile ? `0 -18px 42px ${colors.shadow}` : `0 18px 48px ${colors.shadow}`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          backdropFilter: 'blur(24px) saturate(1.45)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.45)'
        }}
      >
        <div
          style={{
            color: colors.text,
            padding: isMobile ? '10px 14px 8px' : '14px 16px',
            borderBottom: `1px solid ${colors.border}`
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <strong style={{ fontSize: '18px' }}>Stores</strong>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: colors.secondaryText, fontSize: '13px', fontWeight: 700 }}>
                {visibleStores.length} visible
              </span>
              {isMobile && (
                <button
                  onClick={() => setIsMobileListOpen(false)}
                  aria-label="Close stores"
                  style={{
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: colors.secondaryText,
                    padding: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <CloseIcon />
                </button>
              )}
            </span>
          </span>
        </div>

        <div style={{ padding: isMobile ? '0 14px 12px' : '14px 16px 12px' }}>{renderSearch(false)}</div>
        {renderStoreList(isMobile)}
      </section>
    </div>
  );

  return (
    <div
      style={{
        height: '100vh',
        minHeight: '100vh',
        backgroundColor: colors.background,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: colors.text,
        overflow: 'hidden'
      }}
    >
      <header
        style={{
          padding: isMobile ? '12px' : '12px 18px',
          backgroundColor: colors.panel,
          borderBottom: `1px solid ${colors.border}`,
          zIndex: 20,
          backdropFilter: 'blur(16px)'
        }}
      >
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: isMobile ? 'flex-start' : 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexDirection: isMobile ? 'column' : 'row'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <img
              src={StationeryIcon}
              alt="Stationery Store Map"
              style={{
                width: 46,
                height: 46,
                borderRadius: 10,
                background: 'white',
                boxShadow: `0 2px 8px ${colors.shadow}`
              }}
            />
            <div style={{ minWidth: 0 }}>
              <h1
                style={{
                  fontSize: isMobile ? '21px' : '24px',
                  fontWeight: 800,
                  color: colors.text,
                  margin: 0,
                  whiteSpace: 'nowrap'
                }}
              >
                Stationery Store Map
              </h1>
              <p style={{ fontSize: '13px', color: colors.secondaryText, margin: '3px 0 0' }}>
                {stores.length} shops · Last updated {LAST_UPDATED} · Powered by{' '}
                <a
                  href="https://www.penedex.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: colors.accent, textDecoration: 'none', fontWeight: 800 }}
                >
                  Penedex
                </a>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: isMobile ? '100%' : 'auto' }}>
            {isMobile && !isMobileListOpen && (
              <button onClick={() => setIsMobileListOpen(true)} style={headerButtonStyle(colors)}>
                Show Stores
              </button>
            )}
            <a
              href={SUBMIT_STORE_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={headerButtonStyle(colors)}
            >
              Submit Store
            </a>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              aria-label="Toggle color mode"
              style={{
                ...iconButtonStyle(colors),
                marginLeft: isMobile ? 'auto' : 0
              }}
            >
              {isDarkMode ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
      </header>

      <main
        style={{
          flex: '1 1 auto',
          minHeight: 0,
          padding: isMobile ? 0 : '14px',
          width: '100%',
          display: 'flex',
          gap: '14px',
          position: 'relative',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
      >
        <div
          style={{
            flex: '1 1 auto',
            position: 'relative',
            backgroundColor: colors.card,
            borderRadius: isMobile ? 0 : '8px',
            boxShadow: isMobile ? 'none' : `0 2px 14px ${colors.shadow}`,
            overflow: 'hidden',
            minHeight: 0,
            width: '100%'
          }}
        >
          {mapError ? (
            <div
              style={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
                color: '#EF4444',
                padding: '1rem',
                borderRadius: '8px',
                fontSize: '15px'
              }}
            >
              <strong>Error: </strong>
              <span>{mapError}</span>
            </div>
          ) : (
            <div
              ref={mapContainer}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%'
              }}
            />
          )}

          <div
            style={{
              position: 'absolute',
              top: '14px',
              left: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              zIndex: 4
            }}
          >
            <button onClick={handleLocateMe} style={mapControlStyle(colors)} disabled={isLocating}>
              <LocateIcon />
              <span>{isLocating ? 'Locating...' : 'Locate me'}</span>
            </button>
            {locationError && (
              <div
                style={{
                  maxWidth: '230px',
                  backgroundColor: colors.mapOverlay,
                  color: '#EF4444',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  padding: '8px 10px',
                  fontSize: '12px',
                  boxShadow: `0 8px 22px ${colors.shadow}`
                }}
              >
                {locationError}
              </div>
            )}
          </div>

          {renderSelectedStorePanel()}
          {renderFloatingStorePanel()}
        </div>
      </main>
    </div>
  );
}

function Chevron({ expanded, color, size }: { expanded: boolean; color: string; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
        transition: 'transform 0.2s ease',
        flexShrink: 0
      }}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function LocateIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3" />
      <path d="M12 19v3" />
      <path d="M2 12h3" />
      <path d="M19 12h3" />
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

const headerButtonStyle = (colors: typeof lightColors) => ({
  backgroundColor: colors.accentSoft,
  border: `1px solid ${colors.border}`,
  color: colors.text,
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 800,
  padding: '9px 12px',
  borderRadius: '8px',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  whiteSpace: 'nowrap' as const
});

const iconButtonStyle = (colors: typeof lightColors) => ({
  backgroundColor: 'transparent',
  border: `1px solid ${colors.border}`,
  color: colors.text,
  width: '38px',
  height: '38px',
  borderRadius: '8px',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0
});

const actionLinkStyle = (backgroundColor: string, color: string, borderColor?: string) => ({
  backgroundColor,
  border: `1px solid ${borderColor ?? backgroundColor}`,
  color,
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 800,
  padding: '10px 13px',
  borderRadius: '8px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center'
});

const glassBackground = (colors: typeof lightColors, isDarkMode: boolean) =>
  isDarkMode
    ? `linear-gradient(145deg, rgba(29, 27, 25, 0.92), rgba(29, 27, 25, 0.76)), ${colors.panel}`
    : `linear-gradient(145deg, rgba(255, 255, 255, 0.92), rgba(255, 248, 239, 0.76)), ${colors.panel}`;

const mapControlStyle = (colors: typeof lightColors) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  backgroundColor: colors.mapOverlay,
  border: `1px solid ${colors.border}`,
  color: colors.text,
  boxShadow: `0 8px 22px ${colors.shadow}`,
  borderRadius: '8px',
  padding: '10px 12px',
  fontSize: '13px',
  fontWeight: 800,
  cursor: 'pointer',
  backdropFilter: 'blur(16px)'
});

export default App;

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux'; // Import Redux hooks
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import Map from 'react-map-gl/mapbox'; // Make sure this matches your setup (mapbox or maplibre)
import 'mapbox-gl/dist/mapbox-gl.css'; // Import Mapbox CSS

// Import necessary actions (adjust paths if needed)
import { fetchLandmarks, fetchBoundaries, fetchTicinoBoundary, fetchTourismRegions } from '../actions/landmarkActions'; // Assuming these actions exist
import { updateViewport } from '../actions/mapActions';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z2gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA'; // Fallback token

const MapView = () => {
  const dispatch = useDispatch();

  // Get data and map state from Redux store
  const { landmarks, boundaries, ticinoBoundary, tourismRegions } = useSelector((state) => state.landmarks); // Adjust selector based on your store structure
  const { center, zoom, pitch, bearing, mapStyle, isMapLoaded, visibleLayers } = useSelector((state) => state.map);

  // Local view state, initialized from Redux or defaults
  const [viewState, setViewState] = useState({
    longitude: center[0] || 8.55,
    latitude: center[1] || 47.37,
    zoom: zoom || 7,
    pitch: pitch || 0,
    bearing: bearing || 0
  });

  // Fetch data when component mounts
  useEffect(() => {
    // Dispatch actions to fetch data - ensure these actions exist and work
    dispatch(fetchLandmarks());
    // dispatch(fetchBoundaries()); // Uncomment if you have these
    // dispatch(fetchTicinoBoundary()); // Uncomment if you have these
    // dispatch(fetchTourismRegions()); // Uncomment if you have these
  }, [dispatch]);

  // Update Redux store when local view state changes
  const handleViewStateChange = ({ viewState: newViewState }) => {
    setViewState(newViewState);
    dispatch(updateViewport({
        center: [newViewState.longitude, newViewState.latitude],
        zoom: newViewState.zoom,
        pitch: newViewState.pitch,
        bearing: newViewState.bearing
    }));
  };

  // Define layers using GeoJsonLayer and data from Redux state
  const layers = [
    visibleLayers.landmarks && landmarks && new GeoJsonLayer({
      id: 'landmarks',
      data: landmarks,
      getFillColor: [255, 0, 0, 180],
      pointRadiusMinPixels: 5,
      pickable: true
    }),
    visibleLayers.boundaries && boundaries && new GeoJsonLayer({
      id: 'boundaries',
      data: boundaries,
      getLineColor: [0, 0, 0, 255],
      lineWidthMinPixels: 2
    }),
    visibleLayers.ticino && ticinoBoundary && new GeoJsonLayer({
      id: 'ticino',
      data: ticinoBoundary,
      getFillColor: [128, 128, 128, 80]
    }),
    visibleLayers.tourismRegions && tourismRegions && new GeoJsonLayer({
      id: 'tourismRegions',
      data: tourismRegions,
      getFillColor: [0, 255, 0, 80]
    })
  ].filter(Boolean); // Filter out layers with no data or if not visible

  return (
    <DeckGL
      initialViewState={viewState} // Use local viewState managed by component
      controller={true} // Enables map interaction
      layers={layers}
      onViewStateChange={handleViewStateChange} // Update local and Redux state
      style={{ position: 'relative', width: '100vw', height: '100vh' }} // Ensure DeckGL takes up space
    >
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={mapStyle || "mapbox://styles/mapbox/light-v10"} // Use mapStyle from Redux or default
      />
    </DeckGL>
  );
};

export default MapView; 
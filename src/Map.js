import {
  Autocomplete,
  GoogleMap,
  LoadScript,
  Rectangle,
} from "@react-google-maps/api";
import { centerAtom, predictionAtom, viewportAtom, zoomAtom } from "./atoms";
import { useRef, useState } from "react";

import { useAtom } from "jotai";

const containerStyle = {
  width: "100vw",
  height: "100vh",
};

const options = {
  streetViewControl: false,
  fullscreenControl: false,
  mapTypeControl: false,
  rotateControl: false,
};

const center = {
  lat: parseFloat(process.env.REACT_APP_DEFAULT_LAT),
  lng: parseFloat(process.env.REACT_APP_DEFAULT_LNG),
};

function Map(props) {
  const [, setZoom] = useAtom(zoomAtom);
  const [, setCenter] = useAtom(centerAtom);
  const mapRef = useRef(null);
  const searchRef = useRef(null);
  const [libraries] = useState(["places"]);
  const [{ loading, bounds }] = useAtom(predictionAtom);
  const [viewport] = useAtom(viewportAtom);

  const handleMapLoad = (map) => {
    map.mapTypeId = "satellite";
    mapRef.current = map;
  };

  const handleCenterChanged = () => {
    if (!mapRef.current) return;
    setCenter(mapRef.current.getCenter().toJSON());
  };

  const handleZoomChanged = () => {
    if (!mapRef.current) return;
    setZoom(mapRef.current.getZoom());
  };

  const handleAutocompleteLoad = (search) => {
    searchRef.current = search;
  };

  const handlePlaceChanged = () => {
    mapRef.current.panTo(
      searchRef.current.getPlace().geometry.location.toJSON()
    );
  };

  return (
    <LoadScript
      googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
      libraries={libraries}
    >
      <GoogleMap
        onLoad={handleMapLoad}
        mapContainerStyle={containerStyle}
        center={center}
        zoom={parseFloat(process.env.REACT_APP_DEFAULT_ZOOM)}
        onCenterChanged={handleCenterChanged}
        onZoomChanged={handleZoomChanged}
        options={options}
      >
        <Autocomplete
          onLoad={handleAutocompleteLoad}
          onPlaceChanged={handlePlaceChanged}
        >
          <input
            type="text"
            placeholder="Search"
            style={{
              fontFamily: "Raleway",
              boxSizing: `border-box`,
              border: `1px solid transparent`,
              width: `340px`,
              height: `42px`,
              padding: `0 12px`,
              borderRadius: `3px`,
              boxShadow: `0 2px 6px rgba(0, 0, 0, 0.3)`,
              fontSize: `14px`,
              outline: `none`,
              textOverflow: `ellipses`,
              position: "absolute",
              left: "50%",
              marginLeft: "-120px",
              top: "2%",
            }}
          />
        </Autocomplete>
        {!loading &&
          bounds != null &&
          bounds.map(({ cluster, score, ...bound }, id) => (
            <Rectangle
              key={`rect${id}`}
              options={{
                strokeColor: ["#333333", "#127852", "#A7002D", "#A3A901"][
                  cluster
                ],
                strokeOpacity: score,
                strokeWeight: 2,
                fillColor: ["#333333", "#127852", "#A7002D", "#A3A901"][
                  cluster
                ],
                fillOpacity: 0.35,
              }}
              bounds={bound}
            />
          ))}
        <Rectangle
          options={{
            strokeColor: "#FFFFFF",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: "#FFFFFF",
            fillOpacity: 0.15,
          }}
          bounds={viewport}
        />
      </GoogleMap>
    </LoadScript>
  );
}

export default Map;

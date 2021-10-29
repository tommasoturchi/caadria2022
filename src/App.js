import * as tf from "@tensorflow/tfjs";

import { Autocomplete, GoogleMap, LoadScript } from "@react-google-maps/api";
import { useEffect, useRef, useState } from "react";

const url = {
  model:
    "https://storage.googleapis.com/tfjs-models/tfjs/sentiment_cnn_v1/model.json",
  metadata:
    "https://storage.googleapis.com/tfjs-models/tfjs/sentiment_cnn_v1/metadata.json",
};

const REACT_APP_GOOGLE_MAPS_API_KEY = "AIzaSyAv55aHilkFW-qZwBrurY9xny0SrsA-vvo";

const containerStyle = {
  width: "100vw",
  height: "100vh",
};

const center = {
  lat: 59.3311812,
  lng: 18.0407363,
};

const libraries = ["places"];
const options = {
  streetViewControl: false,
  fullscreenControl: false,
  mapTypeControl: false,
};

function Map(props) {
  const [center, setCenter] = useState(props?.center);
  const [zoom, setZoom] = useState(props?.zoom);
  const mapRef = useRef(null);
  const searchRef = useRef(null);

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

  useEffect(() => {
    console.log(
      `https://maps.googleapis.com/maps/api/staticmap?center=${center.lat},${center.lng}&zoom=${zoom}&size=600x600&maptype=satellite&key=${REACT_APP_GOOGLE_MAPS_API_KEY}`
    );
  }, [center, zoom]);

  const handleAutocompleteLoad = (ref) => {
    console.log("Autocomplete loaded", ref);
    searchRef.current = ref;
  };

  const handlePlaceChanged = () => {
    mapRef.current.panTo(
      searchRef.current.getPlace().geometry.location.toJSON()
    );
  };

  return (
    <GoogleMap
      onLoad={handleMapLoad}
      mapContainerStyle={containerStyle}
      center={props?.center}
      zoom={props?.zoom}
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
          placeholder="Input"
          style={{
            boxSizing: `border-box`,
            border: `1px solid transparent`,
            width: `240px`,
            height: `32px`,
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
    </GoogleMap>
  );
}

function App() {
  const [metadata, setMetadata] = useState();
  const [model, setModel] = useState();
  useEffect(() => {
    async function loadModel(url) {
      try {
        const model = await tf.loadLayersModel(url.model);
        setModel(model);
      } catch (err) {
        console.log(err);
      }
    }
    async function loadMetadata(url) {
      try {
        const metadataJson = await fetch(url.metadata);
        const metadata = await metadataJson.json();
        setMetadata(metadata);
      } catch (err) {
        console.log(err);
      }
    }

    tf.ready().then(() => {
      loadModel(url);
      loadMetadata(url);
    });
  }, []);

  useEffect(() => {
    if (metadata && model) {
      const inputText = "You look amazing!"
        .trim()
        .toLowerCase()
        .replace(/(\.|,|!)/g, "")
        .split(" ");
      //Convert the alphabetical token to numerical token using metadata
      const OOV_INDEX = 2;
      const sequence = inputText.map((word) => {
        let wordIndex = metadata.word_index[word] + metadata.index_from;
        if (wordIndex > metadata.vocabulary_size) {
          wordIndex = OOV_INDEX;
        }
        return wordIndex;
      });
      const PAD_INDEX = 0;
      const padSequences = (
        sequences,
        maxLen,
        padding = "pre",
        truncating = "pre",
        value = PAD_INDEX
      ) => {
        return sequences.map((seq) => {
          if (seq.length > maxLen) {
            if (truncating === "pre") {
              seq.splice(0, seq.length - maxLen);
            } else {
              seq.splice(maxLen, seq.length - maxLen);
            }
          }
          if (seq.length < maxLen) {
            const pad = [];
            for (let i = 0; i < maxLen - seq.length; ++i) {
              pad.push(value);
            }
            if (padding === "pre") {
              seq = pad.concat(seq);
            } else {
              seq = seq.concat(pad);
            }
          }
          return seq;
        });
      };
      const paddedSequence = padSequences([sequence], metadata.max_len);
      const input = tf.tensor2d(paddedSequence, [1, metadata.max_len]);
      const predictOut = model.predict(input);
      const score = predictOut.dataSync()[0];
      predictOut.dispose();

      console.log("Score:", score);
    }
  }, [model, metadata]);

  return (
    <div className="App">
      <header className="App-header">
        <LoadScript
          googleMapsApiKey={REACT_APP_GOOGLE_MAPS_API_KEY}
          libraries={libraries}
        >
          <Map center={center} zoom={14} />
        </LoadScript>
      </header>
    </div>
  );
}

export default App;

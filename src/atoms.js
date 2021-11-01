import * as tf from "@tensorflow/tfjs";

import { atom } from "jotai";

tf.ready().then(() => {
  tf.setBackend("cpu");
}); // webgl2 is buggy on chrome

export const zoomAtom = atom(parseFloat(process.env.REACT_APP_DEFAULT_ZOOM));

export const centerAtom = atom({
  lat: parseFloat(process.env.REACT_APP_DEFAULT_LAT),
  lng: parseFloat(process.env.REACT_APP_DEFAULT_LNG),
});

// !python export.py --weights /content/yolov5/runs/train/yolov5s_results2/weights/best.pt --include tflite
// !python export.py --weights /content/yolov5/runs/train/yolov5s_results2/weights/best.pt --include tfjs
export const modelAtom = atom(null);
modelAtom.onMount = (setModel) => {
  const run = async () => {
    await tf
      .loadGraphModel(process.env.REACT_APP_MODEL_URL)
      .then((model) => setModel(model));
  };
  run();
};

const predictionResultAtom = atom({
  loading: false,
  error: null,
  result: "—",
});
export const predictionAtom = atom(
  (get) => get(predictionResultAtom),
  (get, set) => {
    const model = get(modelAtom);
    const center = get(centerAtom);
    const zoom = get(zoomAtom);
    const url = `https://maps.googleapis.com/maps/api/staticmap?center=${center.lat},${center.lng}&zoom=${zoom}&size=${process.env.REACT_APP_IMG_SIZE}x${process.env.REACT_APP_IMG_SIZE}&maptype=satellite&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`;

    const run = async () => {
      set(predictionResultAtom, (prev) => ({ ...prev, loading: true }));
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = function () {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.height = this.height;
          canvas.width = this.width;
          ctx.drawImage(this, 0, 0);

          const imageData = ctx.getImageData(0, 0, this.width, this.height);
          const input = tf.image
            .resizeBilinear(tf.browser.fromPixels(imageData), [
              parseInt(process.env.REACT_APP_IMG_SIZE),
              parseInt(process.env.REACT_APP_IMG_SIZE),
            ])
            .div(255.0)
            .expandDims(0);

          model.executeAsync(input).then((res) => {
            const [, , , valid_detections] = res;
            const valid_detections_data = valid_detections.dataSync()[0];

            tf.dispose(res);

            set(predictionResultAtom, {
              loading: false,
              error: null,
              result: valid_detections_data,
            });
          });
        };
        img.src = url;
      } catch (error) {
        set(predictionResultAtom, { loading: false, error, result: "—" });
      }
    };

    if (model && url) run();
  }
);

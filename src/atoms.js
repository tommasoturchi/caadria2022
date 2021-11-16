import * as tf from "@tensorflow/tfjs";

import { atom } from "jotai";

tf.ready().then(() => {
  if (
    navigator.userAgent.indexOf("Chrome") > -1 ||
    navigator.userAgent.indexOf("Firefox") > -1
  )
    tf.setBackend("cpu");
}); // webgl2 is buggy on chrome

export const zoomAtom = atom(parseFloat(process.env.REACT_APP_DEFAULT_ZOOM));

export const centerAtom = atom({
  lat: parseFloat(process.env.REACT_APP_DEFAULT_LAT),
  lng: parseFloat(process.env.REACT_APP_DEFAULT_LNG),
});

export const modelAtom = atom(null);
modelAtom.onMount = (setModel) => {
  const run = async () => {
    await tf
      .loadGraphModel(process.env.REACT_APP_MODEL_URL)
      .then((model) => setModel(model));
  };
  run();
};

const cropToCanvas = (image, canvas, ctx) => {
  const naturalWidth = image.naturalWidth;
  const naturalHeight = image.naturalHeight;

  canvas.width = image.width;
  canvas.height = image.height;

  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const ratio = Math.min(
    canvas.width / image.naturalWidth,
    canvas.height / image.naturalHeight
  );
  const newWidth = Math.round(naturalWidth * ratio);
  const newHeight = Math.round(naturalHeight * ratio);
  ctx.drawImage(
    image,
    0,
    0,
    naturalWidth,
    naturalHeight,
    (canvas.width - newWidth) / 2,
    (canvas.height - newHeight) / 2,
    newWidth,
    newHeight
  );
};

const predictionResultAtom = atom({
  loading: false,
  error: null,
  resilience: null,
  clusters: null,
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
          cropToCanvas(img, canvas, ctx);

          const imageData = ctx.getImageData(0, 0, this.width, this.height);
          const input = tf.tidy(() =>
            tf.image
              .resizeBilinear(tf.browser.fromPixels(imageData), [
                parseInt(process.env.REACT_APP_IMG_SIZE),
                parseInt(process.env.REACT_APP_IMG_SIZE),
              ])
              .div(255.0)
              .expandDims(0)
          );

          model.executeAsync(input).then((res) => {
            const [boxes, , classes, valid_detections] = res;
            const boxes_data = boxes.dataSync();
            const classes_data = classes.dataSync();
            const valid_detections_data = valid_detections.dataSync()[0];

            tf.dispose(res);

            let resilience = 0;
            let clusters = [[], [], [], []];
            for (let c = 0; c < valid_detections_data; ++c) {
              const [x1, y1, x2, y2] = boxes_data.slice(c * 4, (c + 1) * 4);
              const boxCenter = [(x1 + x2) / 2, (y1 + y2) / 2];

              const pixelDistance =
                Math.sqrt(
                  Math.pow(boxCenter[0] - 0.5, 2) +
                    Math.pow(boxCenter[1] - 0.5, 2)
                ) * canvas.width;

              const kmDistance =
                (pixelDistance *
                  156543.03392 *
                  Math.cos((center.lat * Math.PI) / 180)) /
                Math.pow(2, zoom) /
                1000;

              let gamma = 0;
              switch (classes_data[c]) {
                case 2:
                  if (kmDistance <= 12.5) gamma = 1;
                  else if (kmDistance <= 25) gamma = 0.5;
                  else gamma = 0.25;
                  break;
                default:
                  if (kmDistance <= 1.6) gamma = 1;
                  else if (kmDistance <= 2.4) gamma = 0.75;
                  else if (kmDistance <= 8) gamma = 0.5;
                  else gamma = 0.25;
              }

              resilience += kmDistance * gamma;
              clusters[classes_data[c]].push(kmDistance);
            }

            set(predictionResultAtom, {
              loading: false,
              error: null,
              resilience,
              clusters,
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

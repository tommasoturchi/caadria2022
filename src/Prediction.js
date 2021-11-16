import { modelAtom, predictionAtom } from "./atoms";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Fab from "@mui/material/Fab";
import Paper from "@mui/material/Paper";
import PredictionIcon from "@mui/icons-material/OnlinePrediction";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";
import { useAtom } from "jotai";
import { useCallback } from "react";

const InfoBox = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1),
  backgroundColor: "#121212",
}));

export function Prediction() {
  const [{ resilience, clusters }] = useAtom(predictionAtom);

  return (
    <>
      {clusters != null && (
        <Box sx={{ m: 1, position: "fixed", bottom: "6rem", left: "2rem" }}>
          <InfoBox>
            <Typography variant="subtitle2" component="div" color="primary">
              {`Buildings: ${
                clusters == null || clusters[0].length === 0
                  ? "—"
                  : clusters[0].map((c) => `${c.toFixed(2)}km`).join(", ")
              }`}
            </Typography>
            <Typography variant="subtitle2" component="div" color="primary">
              {`Green Areas: ${
                clusters == null || clusters[1].length === 0
                  ? "—"
                  : clusters[1].map((c) => `${c.toFixed(2)}km`).join(", ")
              }`}
            </Typography>
            <Typography variant="subtitle2" component="div" color="primary">
              {`Infrastructures: ${
                clusters == null || clusters[2].length === 0
                  ? "—"
                  : clusters[2].map((c) => `${c.toFixed(2)}km`).join(", ")
              }`}
            </Typography>
            <Typography variant="subtitle2" component="div" color="primary">
              {`Natural Elements: ${
                clusters == null || clusters[3].length === 0
                  ? "—"
                  : clusters[3].map((c) => `${c.toFixed(2)}km`).join(", ")
              }`}
            </Typography>
          </InfoBox>
        </Box>
      )}
      <Box sx={{ m: 1, position: "fixed", bottom: "2rem", left: "2rem" }}>
        <InfoBox>
          <Typography variant="h6" component="div" color="primary">
            {`Resilience: ${resilience == null ? "—" : resilience.toFixed(2)}`}
          </Typography>
        </InfoBox>
      </Box>
    </>
  );
}

export function MakePrediction() {
  const [initModel] = useAtom(modelAtom);
  const [{ loading }, predict] = useAtom(predictionAtom);

  const handleButtonClick = useCallback(() => predict(), [predict]);

  return (
    <Box sx={{ m: 1, position: "absolute", bottom: "2rem", right: "4rem" }}>
      <Fab
        aria-label="predict"
        color={loading || initModel == null ? "disabled" : "primary"}
        onClick={handleButtonClick}
      >
        <PredictionIcon />
      </Fab>
      {(loading || initModel == null) && (
        <CircularProgress
          size={68}
          color="secondary"
          sx={{
            position: "absolute",
            top: -6,
            left: -6,
            zIndex: 1,
          }}
        />
      )}
    </Box>
  );
}

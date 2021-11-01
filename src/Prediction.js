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
  textAlign: "center",
  padding: theme.spacing(1),
  backgroundColor: "#121212",
}));

export function Prediction() {
  // eslint-disable-next-line no-unused-vars
  const [initModel] = useAtom(modelAtom);
  const [{ result }] = useAtom(predictionAtom);

  return (
    <Box sx={{ m: 1, position: "absolute", bottom: "2rem", left: "2rem" }}>
      <InfoBox>
        <Typography variant="h6" component="div" color="primary">
          {`Resilience: ${result}`}
        </Typography>
      </InfoBox>
    </Box>
  );
}

export function MakePrediction() {
  const [{ loading }, predict] = useAtom(predictionAtom);

  const handleButtonClick = useCallback(() => predict(), [predict]);

  return (
    <Box sx={{ m: 1, position: "absolute", bottom: "2rem", right: "4rem" }}>
      <Fab aria-label="predict" color="primary" onClick={handleButtonClick}>
        <PredictionIcon />
      </Fab>
      {loading && (
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

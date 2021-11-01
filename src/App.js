import { MakePrediction, Prediction } from "./Prediction";

import Map from "./Map";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./theme";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Map />
      <Prediction />
      <MakePrediction />
    </ThemeProvider>
  );
}

export default App;

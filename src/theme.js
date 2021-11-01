import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    type: "dark",
    primary: {
      main: "#f1fd77",
    },
    secondary: {
      main: "#8277fd",
    },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: "Raleway",
  }
});

export default theme;

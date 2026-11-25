"use client";

import { createTheme } from "@mui/material/styles";

/** Shared Material UI defaults for Exeter's application interface. */
const theme = createTheme({
  typography: {
    fontFamily: "Arial, sans-serif",
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
    },
  },
});

export default theme;

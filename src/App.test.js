import React from "react";
import { render } from "@testing-library/react";
import App from "./App";

// jsdom has no WebGL context; the Scene bails out gracefully and the rest of
// the page must still render.
test("renders the hero headline and the search field", () => {
  const { getByText, getByLabelText } = render(<App />);
  expect(getByText(/worth knowing/i)).toBeInTheDocument();
  expect(getByLabelText(/search for a celebrity/i)).toBeInTheDocument();
});

import { render, screen } from '@testing-library/react';
import App from './App';

/**
 * Test: Checks that the App component renders correctly.
 * 
 * Purpose:
 *  - Ensures that the App component mounts without crashing.
 *  - Verifies that specific expected content appears in the DOM.
 * 
 * Expected Inputs:
 *  - None (renders the App component as-is)
 * 
 * Expected Outputs:
 *  - Confirms that a DOM element containing the text "learn react" is present.
 * 
 * Side Effects:
 *  - Renders the App component in a virtual DOM provided by the testing library.
 */

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});

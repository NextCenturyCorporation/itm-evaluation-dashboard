import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';
import unfetch from 'unfetch';

// Mock global fetch and other browser-specific APIs
global.fetch = unfetch;
global.URL.createObjectURL = jest.fn(() => 'mock-object-url');

// Mock HTMLCanvasElement.getContext globally (if needed for tests)
// try {
//     global.HTMLCanvasElement.prototype.getContext = jest.fn(() => {
//         return {}; // You can return an empty object or a mock function
//     });
// }
// catch {
//     console.warn(("Could not load HTMLCanvasElement"));
// }

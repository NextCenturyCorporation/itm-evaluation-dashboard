import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';
import unfetch from 'unfetch';

global.fetch = unfetch;
global.URL.createObjectURL = jest.fn(() => 'mock-object-url');
// Mock HTMLCanvasElement.getContext globally
global.HTMLCanvasElement.prototype.getContext = jest.fn(() => {
    return {}; // You can return an empty object or a mock function if needed
});
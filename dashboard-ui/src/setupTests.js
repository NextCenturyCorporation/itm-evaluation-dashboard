import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';
import unfetch from 'unfetch';

// Mock global fetch and other browser-specific APIs
global.fetch = unfetch;
global.URL.createObjectURL = jest.fn(() => 'mock-object-url');

// Mock HTMLCanvasElement.getContext globally (if needed for tests)
try {
    global.HTMLCanvasElement.prototype.getContext = jest.fn(() => {
        return {}; // You can return an empty object or a mock function
    });
}
catch {
    console.warn(("Could not load HTMLCanvasElement"));
}

// This might be unnecessary if jest-puppeteer is used
// If `jest-puppeteer` is already setting up `global.browser` and `global.page` for you, skip this.
// global.__BROWSER__ = global.browser;  // Only needed if you manually manage `browser`

// beforeAll(async () => {
//     // Ensure `global.__BROWSER__` is initialized, if you're managing the browser manually
//     if (!global.__BROWSER__) {
//         throw new Error('Browser is not initialized');
//     }

//     // Open a new page
//     global.page = await global.__BROWSER__.newPage();
// });

// afterAll(async () => {
//     // Ensure `global.page` is available before calling `close()`
//     if (global.page) {
//         await global.page.close();
//     } else {
//         console.warn('Page was not initialized or already closed');
//     }
// });

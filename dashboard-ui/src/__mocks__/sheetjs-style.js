// __mocks__/sheetjs-style.js
module.exports = {
    XLSX: {
        utils: {
            book_new: jest.fn(),
            book_append_sheet: jest.fn(),
            json_to_sheet: jest.fn(),
            write: jest.fn(),
        },
        writeFile: jest.fn(),
    },
};

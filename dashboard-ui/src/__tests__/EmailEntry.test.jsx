/**
 * @jest-environment puppeteer
 */

import { countElementsWithText, loginAdmin, logout } from "../__mocks__/testUtils";

let firstPid = 0;

describe('Test email-entry text scenarios', () => {
    beforeEach(async () => {
        page = await browser.newPage();
    }, 30000)
    it('/participantText should only have email-entry option', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/participantText`);
        await page.waitForSelector('text=Text Scenario Login');
        const currentUrl = page.url();
        expect(currentUrl).toBe(`${process.env.REACT_APP_TEST_URL}/participantText`);

        let count = await countElementsWithText(page, "Sign In");
        expect(count).toBe(0);

        count = await countElementsWithText(page, "Create Account");
        expect(count).toBe(0);

        count = await countElementsWithText(page, "Text Scenario Login");
        expect(count).toBeGreaterThan(0);
    });

    it('/participantText should error on non-duplicate email', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/participantText`);
        await page.waitForSelector('input[placeholder="Email"]');

        const email1 = await page.$('input[placeholder="Email"]');
        const email2 = await page.$('input[placeholder="Confirm Email"]');

        await email1.type('test@123.com');
        await email2.type('test@12.com');
        // will time out if this element is not found
        await page.waitForSelector('text=Email Mismatch');
    });

    it('/participantText should not error on matching email (case insensitive)', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/participantText`);
        await page.waitForSelector('input[placeholder="Email"]');

        const email1 = await page.$('input[placeholder="Email"]');
        const email2 = await page.$('input[placeholder="Confirm Email"]');

        await email1.type('test@123.com');
        await email2.type('T');
        let count = await countElementsWithText(page, "Email Mismatch");
        expect(count).toBeGreaterThan(0);
        await email2.type('esT@123.com');
        count = await countElementsWithText(page, "Email Mismatch");
        expect(count).toBe(0);
    });

    it('matching emails on /participantText should navigate to /text-based', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/participantText`);
        await page.waitForSelector('input[placeholder="Email"]');

        const email1 = await page.$('input[placeholder="Email"]');
        const email2 = await page.$('input[placeholder="Confirm Email"]');

        await email1.type('ptextTester@123.com');
        await email2.type('ptextTester@123.com');
        await page.$$eval('.form-group button', buttons => {
            Array.from(buttons).find(btn => btn.textContent == 'Start').click();
        });
        await page.waitForSelector('text/Welcome');
        const currentUrl = page.url();
        firstPid = currentUrl.split('pid=').slice(-1)[0];
        expect(currentUrl).toContain(`${process.env.REACT_APP_TEST_URL}/text-based`);
    }, 10000);

    it('new email entry on /participantText should generate new PID', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/participantText`);
        await page.waitForSelector('input[placeholder="Email"]');

        const email1 = await page.$('input[placeholder="Email"]');
        const email2 = await page.$('input[placeholder="Confirm Email"]');

        await email1.type('tester1@123.com');
        await email2.type('TESTER1@123.com');
        await page.$$eval('.form-group button', buttons => {
            Array.from(buttons).find(btn => btn.textContent == 'Start').click();
        });
        await page.waitForSelector('text/Welcome');
        const currentUrl = page.url();
        const thisPid = currentUrl.split('pid=').slice(-1)[0];
        expect(currentUrl).toContain(`${process.env.REACT_APP_TEST_URL}/text-based`);
        expect(thisPid).not.toBe(firstPid);
    }, 10000);

    it('duplicate email entry on /participantText should generate duplicate PID', async () => {
        await page.goto(`${process.env.REACT_APP_TEST_URL}/participantText`);
        await page.waitForSelector('input[placeholder="Email"]');

        const email1 = await page.$('input[placeholder="Email"]');
        const email2 = await page.$('input[placeholder="Confirm Email"]');

        await email1.type('ptextTester@123.com');
        await email2.type('PTEXTTESTER@123.com');
        await page.$$eval('.form-group button', buttons => {
            Array.from(buttons).find(btn => btn.textContent == 'Start').click();
        });
        await page.waitForSelector('text/Welcome');
        const currentUrl = page.url();
        const thisPid = currentUrl.split('pid=').slice(-1)[0];
        expect(currentUrl).toContain(`${process.env.REACT_APP_TEST_URL}/text-based`);
        expect(thisPid).toBe(firstPid);
    }, 10000);

    it('PID Lookup should show correct PID for email', async () => {
        await logout(page);
        await page.goto(`${process.env.REACT_APP_TEST_URL}/login`);
        // try to create admin account in case tests run out of order
        await loginAdmin(page);
        const currentUrl = page.url();
        expect(currentUrl).toBe(`${process.env.REACT_APP_TEST_URL}/`);
        const menu = await page.$('#basic-nav-dropdown');
        await menu.click();
        await page.$$eval('a', buttons => {
            Array.from(buttons).find(btn => btn.textContent == 'PID Lookup').click();
        });
        await page.waitForSelector('#emailOnly');
        const emailInput = await page.$('#emailOnly');
        await emailInput.type('pTEXTtester@123.com');
        await page.$$eval('.form-group button', buttons => {
            Array.from(buttons).find(btn => btn.textContent == 'Find PID').click();
        });
        // will time out if it fails
        await page.waitForSelector('text/PID: ' + firstPid.toString());
    }, 10000);

    it('any key combo on text-scenario page should have no effect on progress', async () => {
        // pid should be 702, which should use vol4 for ST. If this test starts failing, the pid has likely changed
        // and more text configs will need to be added to the mock database
        await page.goto(`${process.env.REACT_APP_TEST_URL}/participantText`);
        await page.waitForSelector('input[placeholder="Email"]');

        const email1 = await page.$('input[placeholder="Email"]');
        const email2 = await page.$('input[placeholder="Confirm Email"]');

        await email1.type('keyTester@702.com');
        await email2.type('KeyTester@702.com');
        await page.$$eval('.form-group button', buttons => {
            Array.from(buttons).find(btn => btn.textContent == 'Start').click();
        });
        await page.waitForSelector('text/Welcome');
        await page.$$eval('button', buttons => {
            Array.from(buttons).find(btn => btn.textContent == 'Start').click();
        });
        // https://pptr.dev/api/puppeteer.keyinput
        const keysToPress = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'Power', 'Eject', 'Abort', 'Help', 'Backspace', 'Tab', 'Numpad5', 'NumpadEnter',
            'Enter', '\r', '\n', 'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight', 'Pause', 'CapsLock', 'Escape', 'Convert', 'NonConvert',
            'Space', 'Numpad9', 'PageUp', 'Numpad3', 'PageDown', 'End', 'Numpad1', 'Home', 'Numpad7', 'ArrowLeft', 'Numpad4', 'Numpad8', 'ArrowUp', 'ArrowRight', 'Numpad6',
            'Numpad2', 'ArrowDown', 'Select', 'Open', 'PrintScreen', 'Insert', 'Numpad0', 'Delete', 'NumpadDecimal', 'Digit0', 'Digit1', 'Digit2', 'Digit3', 'Digit4',
            'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'KeyA', 'KeyB', 'KeyC', 'KeyD', 'KeyE', 'KeyF', 'KeyG', 'KeyH', 'KeyI', 'KeyJ', 'KeyK', 'KeyL', 'KeyM', 'KeyN',
            'KeyO', 'KeyP', 'KeyQ', 'KeyR', 'KeyS', 'KeyT', 'KeyU', 'KeyV', 'KeyW', 'KeyX', 'KeyY', 'KeyZ', 'MetaLeft', 'MetaRight', 'ContextMenu', 'NumpadMultiply', 'NumpadAdd',
            'NumpadSubtract', 'NumpadDivide', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'F13', 'F14', 'F15', 'F16', 'F17', 'F18', 'F19', 'F20',
            'F21', 'F22', 'F23', 'F24', 'NumLock', 'ScrollLock', 'AudioVolumeMute', 'AudioVolumeDown', 'AudioVolumeUp', 'MediaTrackNext', 'MediaTrackPrevious', 'MediaStop',
            'MediaPlayPause', 'Semicolon', 'Equal', 'NumpadEqual', 'Comma', 'Minus', 'Period', 'Slash', 'Backquote', 'BracketLeft', 'Backslash', 'BracketRight', 'Quote', 'AltGraph',
            'Props', 'Cancel', 'Clear', 'Shift', 'Control', 'Alt', 'Accept', 'ModeChange', ' ', 'Print', 'Execute', '\u0000', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k',
            'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'Meta', '*', '+', '-', '/', ';', '=', ',', '.', '`', '[', '\\', ']', "'", 'Attn', 'CrSel',
            'ExSel', 'EraseEof', 'Play', 'ZoomOut', ')', '!', '@', '#', '$', '%', '^', '&', '(', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
            'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', ':', '<', '_', '>', '?', '~', '{', '|', '}', '"', 'SoftLeft', 'SoftRight', 'Camera', 'Call', 'EndCall', 'VolumeDown',
            'VolumeUp'];
        for (const key of keysToPress) {
            await page.keyboard.press(key);
            // first question in vol4 for ST should be visible no matter what key is pressed
            await page.waitForSelector('text/Treat Casualty X with hemostatic gauze');
        }
    }, 10000);

    it('text-scenario through email-entry should be navigable', async () => {
        // pid should be 702, which should use vol4 for ST. If this test starts failing, the pid has likely changed
        // and more text configs will need to be added to the mock database
        await page.goto(`${process.env.REACT_APP_TEST_URL}/participantText`);
        await page.waitForSelector('input[placeholder="Email"]');

        const email1 = await page.$('input[placeholder="Email"]');
        const email2 = await page.$('input[placeholder="Confirm Email"]');

        await email1.type('keyTester@702.com');
        await email2.type('KeyTester@702.com');
        await page.$$eval('.form-group button', buttons => {
            Array.from(buttons).find(btn => btn.textContent == 'Start').click();
        });
        await page.waitForSelector('text/Welcome');
        await page.$$eval('button', buttons => {
            Array.from(buttons).find(btn => btn.textContent == 'Start').click();
        });
        const answerChoices = ['Treat Casualty X with hemostatic gauze', 'Treat Casualty G with pressure bandage', 'Treat Casualty C with burn dressing',
            'Treat Casualty V with tourniquet', 'Treat Casualty N with nasopharyngeal airway', 'Treat Casualty W with pressure bandage'];
        for (const answer of answerChoices) {
            await page.waitForSelector(`text/${answer}`, { timeout: 500 });
            await page.click(`input[type="radio"][value="${answer}"]`);
            if (answer != answerChoices.slice(-1)[0])
                await page.click('input[type="button"][value="Next"]');
            else
                await page.click('input[type="button"][value="Complete"]');
        }
        await page.waitForSelector('text/Uploading documents');

    }, 40000);
});
import { isDefined } from "../components/AggregateResults/DataFunctions";

export const FOOTER_TEXT = 'text/This research was developed';
export const WAITING_TEXT = 'Thank you for your interest in the DARPA In the Moment Program.';
export const HOME_TEXT = 'text/Program Questions';

export async function countElementsWithText(page, text) {
    return await page.$$eval('*', (elements, regexString) => {
        const regex = new RegExp(regexString, 'i');  // case-insensitive regex
        return elements
            .map(el => el.textContent.trim())  // Get the text content of all elements
            .filter(text => regex.test(text))  // Filter elements where the text matches the regex
            .length;  // Return the count of matching elements
    }, text);
}

export async function createAccount(page, username, email, password) {
    await page.$$eval('button', buttons => {
        Array.from(buttons).find(btn => btn.textContent == 'Create Account').click();
    });

    const emailInput = await page.$('#createEmail');
    const usernameInput = await page.$('#createUserName');
    const passwordInput = await page.$('#createPassword');
    // clear input
    await page.evaluate(() => document.getElementById("createEmail").value = "");
    await page.evaluate(() => document.getElementById("createUserName").value = "");
    await page.evaluate(() => document.getElementById("createPassword").value = "");
    await emailInput.type(email);
    await usernameInput.type(username);
    await passwordInput.type(password);
    await page.$$eval('.form-group button', buttons => {
        Array.from(buttons).find(btn => btn.textContent == 'Create Account').click();
    });
}

export async function login(page, username, password, createIfDNE = false) {
    const usernameInput = await page.$('input[placeholder="Email / Username"]');
    const passwordInput = await page.$('#password');
    await page.evaluate(() => document.getElementById("userName").value = "");
    await page.evaluate(() => document.getElementById("password").value = "");
    await usernameInput.type(username);
    await passwordInput.type(password);
    await page.$$eval('.form-group button', buttons => {
        Array.from(buttons).find(btn => btn.textContent == 'Sign In').click();
    });

    if (createIfDNE) {
        await page.waitForNavigation();
        let currentUrl = page.url();
        // if we're still on the login page, the user does not exist. Create a new one!
        if (currentUrl == `${process.env.REACT_APP_TEST_URL}/login`) {
            await createAccount(page, username, username + '@123.com', password);
        }
    }
}

export async function logout(page) {
    // make sure page navigates somewhere before logging out
    await page.goto(`${process.env.REACT_APP_TEST_URL}/login`);
    await page.waitForSelector(FOOTER_TEXT);
    let currentUrl = page.url();
    if (currentUrl == `${process.env.REACT_APP_TEST_URL}/awaitingApproval`) {
        await page.$$eval('button', buttons => {
            Array.from(buttons).find(btn => btn.textContent == 'Return to Login').click();
        });
        await page.waitForSelector('text/Sign In');
    }
    else if (![`${process.env.REACT_APP_TEST_URL}/login`, `${process.env.REACT_APP_TEST_URL}/participantText`].includes(currentUrl)) {
        const menu = await page.$('#basic-nav-dropdown');
        if (menu != null) {
            await menu.click();
            await page.$$eval('a', buttons => {
                Array.from(buttons).find(btn => btn.textContent == 'Logout').click();
            });
        }
        await page.waitForSelector('text/Sign In', { timeout: 100000 });
    }
    currentUrl = page.url();
    expect(currentUrl).toBe(`${process.env.REACT_APP_TEST_URL}/login`);
}

export async function testRouteRedirection(route, expectedRedirect = '/login') {
    let currentUrl = page.url();
    await page.goto(`${process.env.REACT_APP_TEST_URL}${route}`);
    if (route == '/text-based')
        await page.waitForNavigation();
    await page.waitForSelector(FOOTER_TEXT, { timeout: 6000 });
    currentUrl = page.url();
    expect(currentUrl).toBe(`${process.env.REACT_APP_TEST_URL}${expectedRedirect}`);
}

export async function loginAdmin(page) {
    await logout(page);
    await login(page, 'admin', 'secretAdminPassword123', true);
    await page.waitForSelector(HOME_TEXT);
}

export async function loginEvaluator(page) {
    await logout(page);
    await login(page, 'eval', 'secretEvalPassword123', true);
    await page.waitForSelector(HOME_TEXT);
}

export async function loginExperimenter(page) {
    await logout(page);
    await login(page, 'exp', 'secretExperimenterPassword123', true);
    await page.waitForSelector(HOME_TEXT);
}

export async function loginAdeptUser(page) {
    await logout(page);
    await login(page, 'adept', 'secretAdeptPassword123', true);
    await page.waitForSelector(HOME_TEXT);
}

export async function loginBasicApprovedUser(page) {
    await logout(page);
    await login(page, 'basic', 'secretBasicPassword123', true);
    await page.waitForSelector('text/Welcome to the ITM Program!');
}

export async function checkRouteContent(page, route, expectedText, isPh1 = false) {
    await page.goto(`${process.env.REACT_APP_TEST_URL}${route}`);
    await page.waitForSelector(FOOTER_TEXT);
    if (isPh1) {
        // click on Phase 1 in drop downs
        if (route.includes('rq') || route.includes('exploratory') || route.includes('humanSimParticipant')) {
            await page.click((route.includes('human') ? '.' : '.rq-') + 'selection-section [role="combobox"]');
            await page.$$eval('[role="listbox"]>*', (buttons) => {
                Array.from(buttons).find(btn => btn.textContent == 'Phase 1 Evaluation').click();
            });
        } else if (route.includes("/results")) {
            await page.$$eval('.nav-menu [role="button"]', (buttons) => {
                Array.from(buttons).find(btn => btn.innerText.includes("Phase 1 Evaluation")).click();
            });
        }
    }
    for (const txt of expectedText) {
        await page.waitForSelector(`text/${txt}`, { timeout: 500 });
    }
}

export async function useMenuNavigation(page, header, selection, expectedRoute, userMenu = false) {
    await page.$$eval((userMenu ? '.login-user-content ' : '') + '.dropdown-toggle', (buttons, header) => {
        if (header != '')
            Array.from(buttons).find(btn => btn.textContent == header).click();
        else
            Array.from(buttons)[0].click();
    }, header);
    await page.$$eval('.dropdown-item', (buttons, selection) => {
        Array.from(buttons).find(btn => btn.textContent == selection).click();
    }, selection);
    const currentUrl = page.url();
    expect(currentUrl).toBe(`${process.env.REACT_APP_TEST_URL}${expectedRoute}`);
}

export async function startAdeptQualtrixSurvey(page) {
    await page.goto(`${process.env.REACT_APP_TEST_URL}/remote-text-survey?adeptQualtrix=true`);
    await page.waitForSelector('text=Welcome to the ITM Text Scenario experiment. Thank you for your participation.', { timeout: 500 });
    await page.$$eval('button', buttons => {
        Array.from(buttons).find(btn => btn.textContent == 'Start').click();
    });
    await page.waitForSelector('text/Page 1 of', { timeout: 500 });
}

export async function startCaciProlificSurvey(page) {
    const IS_PH1 = Number(process.env.REACT_APP_TEST_SURVEY_VERSION) <= 5;
    await page.goto(`${process.env.REACT_APP_TEST_URL}/remote-text-survey?caciProlific=true&PROLIFIC_PID=ALS_test1210b`);
    await page.waitForSelector('text/Consent Form', { timeout: 20000 });
    await page.$$eval('button', btns => {
        const b = Array.from(btns).find(x => x.innerText?.trim() === 'I Agree');
        b?.click();
    });
    await page.waitForSelector('text/Instructions', { timeout: 30000 });
    await page.$$eval('button', btns => {
        const b = Array.from(btns).find(x => x.innerText?.trim() === 'Start');
        b?.click();
    });

    if (IS_PH1) {
        await page.waitForSelector('text/Page 1 of', { timeout: 30000 });
        await page.waitForSelector('input[type="radio"]', { timeout: 30000 });
    }
    else {
        await page.waitForSelector('text/Scenario Details', { timeout: 30000 });
    }
}

export async function agreeToProlificConsent(page) {
    try {
        await page.waitForSelector('text/Consent Form', { timeout: 1000 });
        await page.$$eval('button', btns => {
            const b = Array.from(btns).find(x => x.innerText?.trim() === 'I Agree');
            b?.click();
        });
    } catch (_) {
    }
}

export async function pressAllKeys(page, uniqueExpectedText) {
    // https://pptr.dev/api/puppeteer.keyinput
    const keysToPress = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'Power', 'Eject', 'Abort', 'Help', 'Backspace', 'Numpad5', 'NumpadEnter',
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
        'VolumeUp', 'Tab'];
    for (const key of keysToPress) {
        await page.keyboard.press(key);
        await page.waitForSelector(`text/${uniqueExpectedText}`, { timeout: 5000 });
    }
}

export async function takePhase1TextScenario(page) {
    let pageNum = 1;
    let scenarios = 0;
    while (scenarios < 5) {
        try {
            await page.waitForSelector(`text/Page ${pageNum} of`, { timeout: 2000 });
        } 
        catch (error) 
        {
            if (error.name === 'TimeoutError') {
                await page.waitForSelector('text/Page 1 of', { timeout: 2000 });
                scenarios += 1;
                pageNum = 1;
            } 
            else  {
                throw error;
            }
        }
        await page.focus('input[type="radio"]');
        await page.keyboard.press(' ');
        await page.keyboard.press('Tab');
        const completeBtn = await page.$('text/Complete');
        if (isDefined(completeBtn)) {
            pageNum = 1;
            scenarios += 1;
        }
        else {
            pageNum += 1;
        }
        await page.keyboard.press('Enter');
    }
}

export async function takePhase2TextScenario(page) {
    let pageNum = 1;
    let scenarios = 0;
    while (scenarios < 4) {
        await page.waitForSelector(`text/Page ${pageNum} of`, { timeout: 500 });
        await page.focus('input[type="radio"]');
        await page.keyboard.press(' ');
        await page.keyboard.press('Tab');
        if (pageNum == 6) {
            pageNum = 1;
            scenarios += 1;
        }
        else {
            pageNum += 1;
        }
        await page.keyboard.press('Enter');
    }
}
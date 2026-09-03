import { isDefined } from "../components/AggregateResults/DataFunctions";

export const FOOTER_TEXT = 'text/This research was developed';
export const WAITING_TEXT = 'Thank you for your interest in the DARPA In the Moment Program.';
export const HOME_TEXT = 'text/Program Questions';

export const SURVEY_STEP_TIMEOUT = 60000;
export const TEST_WAIT_TIMEOUT = 120000;
export const LONG_TEST_TIMEOUT = 180000;

export async function logPageDebug(page, label) {
    try {
        const currentUrl = page.url();
        const title = await page.title().catch(() => '<unable to read title>');
        const bodyText = await page.evaluate(() => document.body?.innerText || '').catch(() => '<unable to read page text>');

        console.error(`[TEST DEBUG] ${label}`);
        console.error(`[TEST DEBUG] URL: ${currentUrl}`);
        console.error(`[TEST DEBUG] Title: ${title}`);
        console.error(`[TEST DEBUG] Page text (first 5000 chars):\n${bodyText.slice(0, 5000)}`);
    }
    catch (error) {
        console.error(`[TEST DEBUG] Failed to capture page diagnostics for ${label}:`, error);
    }
}

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
    await page.goto(`${process.env.REACT_APP_TEST_URL}/login`, {
        timeout: TEST_WAIT_TIMEOUT
    });
    await page.waitForSelector(FOOTER_TEXT, { timeout: TEST_WAIT_TIMEOUT });
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
        await page.waitForSelector('text/Sign In', { timeout: TEST_WAIT_TIMEOUT });
    }
    currentUrl = page.url();
    expect(currentUrl).toBe(`${process.env.REACT_APP_TEST_URL}/login`);
}

export async function testRouteRedirection(route, expectedRedirect = '/login') {
    const expectedUrl = `${process.env.REACT_APP_TEST_URL}${expectedRedirect}`;

    try {
        await page.goto(`${process.env.REACT_APP_TEST_URL}${route}`, {
            timeout: TEST_WAIT_TIMEOUT,
            waitUntil: 'domcontentloaded'
        });

        await page.waitForFunction(
            expectedUrl => window.location.href === expectedUrl,
            { timeout: TEST_WAIT_TIMEOUT },
            expectedUrl
        );

        const currentUrl = page.url();
        expect(currentUrl).toBe(expectedUrl);
    }
    catch (error) {
        await logPageDebug(page, `Route redirection failed for ${route} -> ${expectedRedirect}`);
        throw error;
    }
}

export async function loginAdmin(page) {
    await logout(page);
    await login(page, 'admin', 'secretAdminPassword123', true);
    await page.waitForSelector(HOME_TEXT, { timeout: TEST_WAIT_TIMEOUT });
}

export async function loginEvaluator(page) {
    await logout(page);
    await login(page, 'eval', 'secretEvalPassword123', true);
    await page.waitForSelector(HOME_TEXT, { timeout: TEST_WAIT_TIMEOUT });
}

export async function loginExperimenter(page) {
    await logout(page);
    await login(page, 'exp', 'secretExperimenterPassword123', true);
    await page.waitForSelector(HOME_TEXT, { timeout: TEST_WAIT_TIMEOUT });
}

export async function loginAdeptUser(page) {
    await logout(page);
    await login(page, 'adept', 'secretAdeptPassword123', true);
    await page.waitForSelector(HOME_TEXT, { timeout: TEST_WAIT_TIMEOUT });
}

export async function loginBasicApprovedUser(page) {
    await logout(page);
    await login(page, 'basic', 'secretBasicPassword123', true);
    await page.waitForSelector('text/Welcome to the ITM Program!', { timeout: TEST_WAIT_TIMEOUT });
}

export async function checkRouteContent(page, route, expectedText) {
    try {
        await page.goto(`${process.env.REACT_APP_TEST_URL}${route}`, {
            timeout: TEST_WAIT_TIMEOUT,
            waitUntil: 'domcontentloaded'
        });
        await page.waitForSelector(FOOTER_TEXT, { timeout: TEST_WAIT_TIMEOUT });
        for (const txt of expectedText) {
            await page.waitForSelector(`text/${txt}`, { timeout: TEST_WAIT_TIMEOUT });
        }
    }
    catch (error) {
        await logPageDebug(page, `Content check failed for ${route}`);
        throw error;
    }
}

export async function checkRouteSelector(page, route, selector, expectedText = []) {
    try {
        await page.goto(`${process.env.REACT_APP_TEST_URL}${route}`, {
            timeout: TEST_WAIT_TIMEOUT,
            waitUntil: 'domcontentloaded'
        });
        await page.waitForSelector(FOOTER_TEXT, { timeout: TEST_WAIT_TIMEOUT });
        await page.waitForSelector(selector, { timeout: TEST_WAIT_TIMEOUT });

        for (const txt of expectedText) {
            await page.waitForSelector(`text/${txt}`, { timeout: TEST_WAIT_TIMEOUT });
        }
    }
    catch (error) {
        await logPageDebug(page, `Route selector check failed for ${route} (${selector})`);
        throw error;
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
    const IS_PH1 = Number(process.env.REACT_APP_TEST_SURVEY_VERSION) <= 5;
    await page.goto(`${process.env.REACT_APP_TEST_URL}/remote-text-survey?adeptQualtrix=true`, {
        timeout: TEST_WAIT_TIMEOUT,
        waitUntil: 'domcontentloaded'
    });
    await page.waitForSelector('text/Consent Form', { timeout: SURVEY_STEP_TIMEOUT });
    await page.$$eval('button', btns => {
        const b = Array.from(btns).find(x => x.innerText?.trim() === 'I Agree');
        b?.click();
    });
    await page.waitForSelector('text/Instructions', { timeout: SURVEY_STEP_TIMEOUT });
    await page.$$eval('button', btns => {
        const b = Array.from(btns).find(x => x.innerText?.trim() === 'Start');
        b?.click();
    });
    if (IS_PH1) {
        await page.waitForSelector('text/Page 1 of', { timeout: SURVEY_STEP_TIMEOUT });
    } else {
        await page.waitForSelector('text/Scenario Details', { timeout: SURVEY_STEP_TIMEOUT });
    }
}

export async function startCaciProlificSurvey(page) {
    const IS_PH1 = Number(process.env.REACT_APP_TEST_SURVEY_VERSION) <= 5;
    await page.goto(`${process.env.REACT_APP_TEST_URL}/remote-text-survey?caciProlific=true&PROLIFIC_PID=ALS_test1210b`, {
        timeout: TEST_WAIT_TIMEOUT,
        waitUntil: 'domcontentloaded'
    });
    await page.waitForSelector('text/Consent Form', { timeout: SURVEY_STEP_TIMEOUT });
    await page.$$eval('button', btns => {
        const b = Array.from(btns).find(x => x.innerText?.trim() === 'I Agree');
        b?.click();
    });
    await page.waitForSelector('text/Instructions', { timeout: SURVEY_STEP_TIMEOUT });
    await page.$$eval('button', btns => {
        const b = Array.from(btns).find(x => x.innerText?.trim() === 'Start');
        b?.click();
    });

    if (IS_PH1) {
        await page.waitForSelector('text/Page 1 of', { timeout: SURVEY_STEP_TIMEOUT });
        await page.waitForSelector('input[type="radio"]', { timeout: SURVEY_STEP_TIMEOUT });
    }
    else {
        await page.waitForSelector('text/Scenario Details', { timeout: SURVEY_STEP_TIMEOUT });
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
            await page.waitForSelector(`text/Page ${pageNum} of`, { timeout: 5000 });
        } catch (error) {
            if (error.name === 'TimeoutError') {
                await page.waitForSelector(`text/Page 1 of`, { timeout: 5000 });
                scenarios += 1;
                pageNum = 1;
            } else {
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
        await page.waitForSelector(`text/Page ${pageNum} of`, { timeout: 5000 });
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

export async function waitForSurveyIntro(page) {
    await page.waitForSelector('text/In the final part of the study,', { timeout: SURVEY_STEP_TIMEOUT });
}

export async function clickNext(page) {
    await page.$$eval('input', buttons => {
        Array.from(buttons).find(btn => btn.value == 'Next')?.click();
    });
}

export async function completeTextScenarioAndReachSurvey(page, { isPhase1 }) {
    if (isPhase1) {
        await takePhase1TextScenario(page);
    } else {
        await takePhase2TextScenario(page);
    }
    await page.waitForSelector('text/Please do not close your browser', { timeout: SURVEY_STEP_TIMEOUT });
    await page.waitForSelector('text/In the final part of the study,', { timeout: LONG_TEST_TIMEOUT });
    await pressAllKeys(page, 'In the final part of the study,');
}

export async function fillVisibleSurveyQuestions(page) {
    return await page.evaluate(() => {
        const isVisible = element => {
            const style = window.getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return !element.disabled &&
                style.display !== 'none' &&
                style.visibility !== 'hidden' &&
                rect.width > 0 &&
                rect.height > 0;
        };

        const questionContainers = Array.from(
            document.querySelectorAll('.sd-question, .sv_qstn')
        ).filter(isVisible);

        const getChoiceText = input => {
            const label =
                input.closest('label') ||
                document.querySelector(`label[for="${input.id}"]`) ||
                input.parentElement;

            return (label?.innerText || label?.textContent || '').trim();
        };

        const chooseInput = (inputs, preferredTexts = []) => {
            if (!inputs.length || inputs.some(input => input.checked)) {
                return false;
            }

            let target = null;

            preferredTexts.forEach(preferredText => {
                if (!target) {
                    target = inputs.find(input =>
                        getChoiceText(input) === preferredText
                    );
                }
            });

            target = target || inputs[0];

            if (!target) {
                return false;
            }

            // Click the native input so SurveyJS receives the normal choice event,
            // even when the input itself is visually hidden.
            target.click();
            return true;
        };

        let answered = 0;

        questionContainers.forEach(questionContainer => {
            const questionText = (questionContainer.innerText || '').trim();

            const radios = Array.from(
                questionContainer.querySelectorAll('input[type="radio"]')
            );

            if (radios.length > 0) {
                let preferredTexts = [];

                if (questionText.includes('Are you currently or have you previously served in the military?')) {
                    preferredTexts = ['Never Served'];
                }
                else if (questionText.includes('Have you participated in mass casualty events?')) {
                    preferredTexts = ['No'];
                }
                else if (questionText.includes('Did you serve in a military medical role?')) {
                    preferredTexts = ['No'];
                }
                else if (questionText.includes('When did you last complete TCCC training or recertification?')) {
                    preferredTexts = ['Never completed'];
                }

                if (chooseInput(radios, preferredTexts)) {
                    answered += 1;
                }
            }

            const checkboxes = Array.from(
                questionContainer.querySelectorAll('input[type="checkbox"]')
            );

            if (checkboxes.length > 0) {
                let preferredTexts = [];

                if (questionText.includes('In which environments have you provided medical care during military service?')) {
                    preferredTexts = ['None'];
                }

                if (chooseInput(checkboxes, preferredTexts)) {
                    answered += 1;
                }
            }
        });

        Array.from(document.querySelectorAll('select'))
            .filter(isVisible)
            .forEach(select => {
                if (!select.value && select.options.length > 1) {
                    select.selectedIndex = 1;
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                    answered += 1;
                }
            });

        return answered;
    });
}

export async function typeIntoRequiredSurveyTextFields(page) {
    const questionHandles = await page.$$('.sd-question, .sv_qstn');
    let typed = 0;

    for (const question of questionHandles) {
        const questionText = await question.evaluate(element => element.innerText || '');

        if (!questionText.includes('Response required.')) {
            continue;
        }

        const textControl =
            await question.$('textarea') ||
            await question.$('input[type="text"]') ||
            await question.$('input[type="number"]') ||
            await question.$('input[type="email"]') ||
            await question.$('[contenteditable="true"]');

        if (!textControl) {
            continue;
        }

        const isVisible = await textControl.evaluate(element => {
            const style = window.getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return !element.disabled &&
                style.display !== 'none' &&
                style.visibility !== 'hidden' &&
                rect.width > 0 &&
                rect.height > 0;
        });

        if (!isVisible) {
            continue;
        }

        await textControl.click({ clickCount: 3 });

        const tagName = await textControl.evaluate(element => element.tagName);
        const isContentEditable = await textControl.evaluate(element => element.isContentEditable);

        if (isContentEditable) {
            await page.keyboard.down('Control');
            await page.keyboard.press('A');
            await page.keyboard.up('Control');
            await page.keyboard.type('m');
        }
        else {
            await page.keyboard.down('Control');
            await page.keyboard.press('A');
            await page.keyboard.up('Control');
            await page.keyboard.type(
                tagName === 'INPUT' &&
                (await textControl.evaluate(element => element.type)) === 'number'
                    ? '1'
                    : 'm'
            );
        }

        // SurveyJS commits text responses on the normal browser event flow.
        // Tabbing away ensures change/blur handlers run.
        await page.keyboard.press('Tab');
        typed += 1;
    }

    return typed;
}

export async function fillSurveyValidationErrors(page) {
    return await page.evaluate(() => {
        const isVisible = element => {
            const style = window.getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return style.display !== 'none' &&
                style.visibility !== 'hidden' &&
                rect.width > 0 &&
                rect.height > 0;
        };

        const getChoiceText = input => {
            const label =
                input.closest('label') ||
                document.querySelector(`label[for="${input.id}"]`) ||
                input.parentElement;

            return (label?.innerText || label?.textContent || '').trim();
        };

        const questionContainers = Array.from(
            document.querySelectorAll('.sd-question, .sv_qstn')
        ).filter(container =>
            isVisible(container) &&
            (container.innerText || '').includes('Response required.')
        );

        let repaired = 0;

        questionContainers.forEach(questionContainer => {
            const questionText = (questionContainer.innerText || '').trim();

            const radios = Array.from(
                questionContainer.querySelectorAll('input[type="radio"]')
            );

            if (radios.length > 0 && !radios.some(radio => radio.checked)) {
                let preferred = null;

                if (questionText.includes('Are you currently or have you previously served in the military?')) {
                    preferred = radios.find(radio => getChoiceText(radio) === 'Never Served');
                }
                else if (questionText.includes('Have you participated in mass casualty events?')) {
                    preferred = radios.find(radio => getChoiceText(radio) === 'No');
                }

                (preferred || radios[0])?.click();
                repaired += 1;
                return;
            }

            const checkboxes = Array.from(
                questionContainer.querySelectorAll('input[type="checkbox"]')
            );

            if (checkboxes.length > 0 && !checkboxes.some(checkbox => checkbox.checked)) {
                checkboxes[0].click();
                repaired += 1;
                return;
            }

            const nativeSelect = Array.from(
                questionContainer.querySelectorAll('select')
            ).find(select => isVisible(select) && !select.value);

            if (nativeSelect && nativeSelect.options.length > 1) {
                nativeSelect.selectedIndex = 1;
                nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
                repaired += 1;
            }
        });

        return repaired;
    });
}

export async function clickVisibleSurveyButton(page, buttonValue) {
    return await page.evaluate(value => {
        const isVisible = element => {
            const style = window.getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return !element.disabled &&
                style.display !== 'none' &&
                style.visibility !== 'hidden' &&
                rect.width > 0 &&
                rect.height > 0;
        };

        const controls = Array.from(document.querySelectorAll('input, button'))
            .filter(isVisible);

        const button = controls.find(control =>
            (control.value || control.textContent || '').trim() === value
        );

        if (!button) {
            return false;
        }

        button.click();
        return true;
    }, buttonValue);
}

export async function completeCurrentPhase2Survey(page) {
    // Fill the current Phase 2 survey using the controls that are actually
    // rendered rather than depending on a fixed keyboard/tab sequence.
    for (let pageIndex = 0; pageIndex < 10; pageIndex++) {
        await page.waitForFunction(
            () => document.body?.innerText?.trim().length > 0,
            { timeout: TEST_WAIT_TIMEOUT }
        );

        await fillVisibleSurveyQuestions(page);

        const hasComplete = await page.evaluate(() => {
            const controls = Array.from(document.querySelectorAll('input, button'));
            return controls.some(control =>
                (control.value || control.textContent || '').trim() === 'Complete'
            );
        });

        if (hasComplete) {
            let previousValidationCount = null;
            let allReportedErrorsRepaired = false;

            for (let validationAttempt = 1; validationAttempt <= 10; validationAttempt++) {
                const clicked = await clickVisibleSurveyButton(page, 'Complete');

                if (!clicked) {
                    await logPageDebug(page, 'Phase 2 survey Complete button disappeared');
                    throw new Error('Unable to complete Phase 2 survey: Complete button was not available.');
                }

                // Once every error reported by SurveyJS has been repaired, the
                // next Complete click is the submission action. Do not inspect
                // the page after that click: CACI Prolific can immediately
                // navigate to an external target, which can block Puppeteer
                // protocol commands while Chromium initializes that target.
                if (allReportedErrorsRepaired) {
                    return {
                        submitted: true,
                        navigationStarted: true
                    };
                }

                await new Promise(resolve => setTimeout(resolve, 750));

                const validationCount = await page.evaluate(() =>
                    Array.from(document.querySelectorAll('.sd-question, .sv_qstn'))
                        .filter(question =>
                            (question.innerText || '').includes('Response required.')
                        )
                        .length
                );

                if (validationCount === 0) {
                    return {
                        submitted: true,
                        navigationStarted: false
                    };
                }

                // Repair fields SurveyJS explicitly marked invalid. Choice/select
                // controls can be handled in-page; text fields use real typing so
                // SurveyJS receives its normal input/change/blur event sequence.
                const repaired = await fillSurveyValidationErrors(page);
                const typed = await typeIntoRequiredSurveyTextFields(page);

                // Answer any conditional fields revealed by those repairs.
                const newlyAnswered = await fillVisibleSurveyQuestions(page);

                allReportedErrorsRepaired = repaired + typed >= validationCount;

                if (
                    !allReportedErrorsRepaired &&
                    newlyAnswered === 0 &&
                    repaired === 0 &&
                    typed === 0 &&
                    previousValidationCount === validationCount
                ) {
                    await logPageDebug(page, 'Phase 2 survey validation stopped making progress');
                    throw new Error(`Unable to resolve ${validationCount} required Phase 2 survey response(s).`);
                }

                previousValidationCount = validationCount;
            }

            await logPageDebug(page, 'Phase 2 survey exceeded validation retry limit');
            throw new Error('Unable to complete Phase 2 survey after repeated validation attempts.');
        }

        const currentText = await page.evaluate(() => document.body?.innerText || '');
        const advanced = await clickVisibleSurveyButton(page, 'Next');

        if (!advanced) {
            await logPageDebug(page, 'Phase 2 survey has neither a visible Next nor Complete button');
            throw new Error('Unable to advance Phase 2 survey: no visible Next or Complete button.');
        }

        await page.waitForFunction(
            previousText => (document.body?.innerText || '') !== previousText,
            { timeout: TEST_WAIT_TIMEOUT },
            currentText
        ).catch(() => {});
    }

    await logPageDebug(page, 'Phase 2 survey exceeded expected page count');
    throw new Error('Unable to complete Phase 2 survey within 10 pages.');
}

export async function surveyFlowNavigateAndComplete(page, { isPhase1 }) {
    // We start on the survey intro page.
    await clickNext(page);

    if (!isPhase1) {
        await page.waitForSelector(
            'text/What was the biggest influence on your delegation decision between different medics?',
            { timeout: TEST_WAIT_TIMEOUT }
        );

        return await completeCurrentPhase2Survey(page);
    }

    // Legacy Phase 1 flow.
    await page.waitForSelector('text/Note that in some scenarios', { timeout: 50000 });
    await clickNext(page);
    await page.waitForSelector('text/Situation', { timeout: 5000 });

    let pageNum = 3;
    let medics = 0;
    while (medics < 3) {
        await page.waitForSelector(`text/Page ${pageNum} of`, { timeout: 5000 });
        await page.focus('input[type="radio"]');

        for (let i = 0; i < 4; i++) {
            await page.keyboard.press(' ');
            await page.keyboard.press('Tab');
        }

        await clickNext(page);
        medics += 1;
        pageNum += 1;
    }

    await page.waitForSelector('text/Medic-B21 vs Medic-V17', { timeout: 5000 });
    await page.waitForSelector('text/Medic-B16 vs Medic-B21', { timeout: 5000 });
    await page.focus('input[type="radio"]');

    for (let i = 0; i < 2; i++) {
        await page.keyboard.press(' ');
        await page.keyboard.press('Tab');
        await page.keyboard.press(' ');
        await page.keyboard.press('Tab');
        await page.keyboard.press('m');
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
    }

    await clickNext(page);

    await page.waitForSelector(
        'text/What was the biggest influence on your delegation decision between different medics?',
        { timeout: TEST_WAIT_TIMEOUT }
    );

    await page.keyboard.press('Tab');
    await page.keyboard.press('m');

    for (let i = 0; i < 9; i++) {
        await page.keyboard.press('Tab');
        await page.keyboard.press(' ');
    }

    for (let i = 0; i < 8; i++) {
        await page.keyboard.press('Tab');
    }

    for (let i = 0; i < 3; i++) {
        await page.keyboard.press('Tab');
        await page.keyboard.press(' ');
    }

    page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('');
        await dialog.dismiss();
    });

    await page.$$eval('input', buttons => {
        Array.from(buttons).find(btn => btn.value == 'Complete')?.click();
    });

    try {
        await page.waitForSelector(
            'text/Thank you for completing the survey',
            { timeout: TEST_WAIT_TIMEOUT }
        );
    }
    catch (error) {
        await logPageDebug(page, 'CACI Prolific Phase 1 survey did not reach completion screen');
        throw error;
    }
}

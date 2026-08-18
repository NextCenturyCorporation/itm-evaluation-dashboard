import { isDefined } from "../components/AggregateResults/DataFunctions";

export const FOOTER_TEXT = 'text/This research was developed';
export const WAITING_TEXT = 'Thank you for your interest in the DARPA In the Moment Program.';
export const HOME_TEXT = 'text/Program Questions';

export const TEST_WAIT_TIMEOUT = 300000;

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
    const expectedUrl = `${process.env.REACT_APP_TEST_URL}${expectedRedirect}`;

    try {
        await page.goto(`${process.env.REACT_APP_TEST_URL}${route}`, {
            timeout: TEST_WAIT_TIMEOUT
        });
        await page.waitForSelector(FOOTER_TEXT, { timeout: TEST_WAIT_TIMEOUT });

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

export async function checkRouteContent(page, route, expectedText) {
    try {
        await page.goto(`${process.env.REACT_APP_TEST_URL}${route}`, {
            timeout: TEST_WAIT_TIMEOUT
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
            timeout: TEST_WAIT_TIMEOUT
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
    await page.goto(`${process.env.REACT_APP_TEST_URL}/remote-text-survey?adeptQualtrix=true`);
    await page.waitForSelector('text/Consent Form', { timeout: 20000 });
    await page.$$eval('button', btns => {
        const b = Array.from(btns).find(x => x.innerText?.trim() === 'I Agree');
        b?.click();
    });
    await page.waitForSelector('text/Instructions', { timeout: 15000 });
    await page.$$eval('button', btns => {
        const b = Array.from(btns).find(x => x.innerText?.trim() === 'Start');
        b?.click();
    });
    if (IS_PH1) {
        await page.waitForSelector('text/Page 1 of', { timeout: 30000 });
    } else {
        await page.waitForSelector('text/Scenario Details', { timeout: 30000 });
    }
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
        } catch (error) {
            if (error.name === 'TimeoutError') {
                await page.waitForSelector(`text/Page 1 of`, { timeout: 2000 });
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

export async function waitForSurveyIntro(page) {
    await page.waitForSelector('text/In the final part of the study,', { timeout: 30000 });
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
    await page.waitForSelector('text/Please do not close your browser', { timeout: 30000 });
    await page.waitForSelector('text/In the final part of the study,', { timeout: 300000 });
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

        let answered = 0;

        // Answer one option in every visible radio group.
        const radioGroups = new Map();
        Array.from(document.querySelectorAll('input[type="radio"]'))
            .filter(isVisible)
            .forEach(radio => {
                const key = radio.name || `radio-${radio.id}`;
                if (!radioGroups.has(key)) {
                    radioGroups.set(key, []);
                }
                radioGroups.get(key).push(radio);
            });

        radioGroups.forEach(radios => {
            if (!radios.some(radio => radio.checked) && radios.length > 0) {
                radios[0].click();
                answered += 1;
            }
        });

        // Answer one option in every visible checkbox group when none is selected.
        const checkboxGroups = new Map();
        Array.from(document.querySelectorAll('input[type="checkbox"]'))
            .filter(isVisible)
            .forEach(checkbox => {
                const key = checkbox.name || `checkbox-${checkbox.id}`;
                if (!checkboxGroups.has(key)) {
                    checkboxGroups.set(key, []);
                }
                checkboxGroups.get(key).push(checkbox);
            });

        checkboxGroups.forEach(checkboxes => {
            if (!checkboxes.some(checkbox => checkbox.checked) && checkboxes.length > 0) {
                checkboxes[0].click();
                answered += 1;
            }
        });

        // Fill visible text inputs and textareas.
        Array.from(document.querySelectorAll(
            'textarea, input[type="text"], input[type="number"], input[type="email"]'
        ))
            .filter(isVisible)
            .forEach(input => {
                if (input.value) {
                    return;
                }

                const value = input.type === 'number' ? '1' : 'm';
                const prototype = input.tagName === 'TEXTAREA'
                    ? window.HTMLTextAreaElement.prototype
                    : window.HTMLInputElement.prototype;
                const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

                if (valueSetter) {
                    valueSetter.call(input, value);
                } else {
                    input.value = value;
                }

                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                answered += 1;
            });

        // Select the first real option in any visible native select.
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

export async function fillSurveyValidationErrors(page) {
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

        const errorMarkers = Array.from(document.querySelectorAll('*'))
            .filter(element =>
                isVisible(element) &&
                (element.textContent || '').trim() === 'Response required.'
            );

        let repaired = 0;

        for (const marker of errorMarkers) {
            const questionContainer =
                marker.closest('.sd-question') ||
                marker.closest('.sv_qstn') ||
                marker.closest('[data-name]') ||
                marker.parentElement?.parentElement ||
                marker.parentElement;

            if (!questionContainer) {
                continue;
            }

            const radios = Array.from(
                questionContainer.querySelectorAll('input[type="radio"]')
            ).filter(isVisible);

            if (radios.length > 0 && !radios.some(radio => radio.checked)) {
                radios[0].click();
                repaired += 1;
                continue;
            }

            const checkboxes = Array.from(
                questionContainer.querySelectorAll('input[type="checkbox"]')
            ).filter(isVisible);

            if (checkboxes.length > 0 && !checkboxes.some(checkbox => checkbox.checked)) {
                checkboxes[0].click();
                repaired += 1;
                continue;
            }

            const textInput = Array.from(
                questionContainer.querySelectorAll(
                    'textarea, input[type="text"], input[type="number"], input[type="email"]'
                )
            ).find(isVisible);

            if (textInput && !textInput.value) {
                const value = textInput.type === 'number' ? '1' : 'm';
                const prototype = textInput.tagName === 'TEXTAREA'
                    ? window.HTMLTextAreaElement.prototype
                    : window.HTMLInputElement.prototype;
                const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

                if (setter) {
                    setter.call(textInput, value);
                } else {
                    textInput.value = value;
                }

                textInput.dispatchEvent(new Event('input', { bubbles: true }));
                textInput.dispatchEvent(new Event('change', { bubbles: true }));
                repaired += 1;
                continue;
            }

            const nativeSelect = Array.from(
                questionContainer.querySelectorAll('select')
            ).find(isVisible);

            if (nativeSelect && !nativeSelect.value && nativeSelect.options.length > 1) {
                nativeSelect.selectedIndex = 1;
                nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
                repaired += 1;
                continue;
            }

            // SurveyJS dropdowns can be rendered as custom combobox controls.
            const combo = Array.from(
                questionContainer.querySelectorAll('[role="combobox"]')
            ).find(isVisible);

            if (combo) {
                combo.click();
                repaired += 1;
            }
        }

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
    // The current survey is multi-page. Fill what is actually visible rather
    // than relying on a fixed number of Tab presses, which becomes stale when
    // survey questions change.
    for (let pageIndex = 0; pageIndex < 10; pageIndex++) {
        await page.waitForFunction(
            () => document.body?.innerText?.trim().length > 0,
            { timeout: TEST_WAIT_TIMEOUT }
        );

        const answered = await fillVisibleSurveyQuestions(page);
        console.log(`[TEST DEBUG] Phase 2 survey page ${pageIndex + 1}: answered ${answered} visible question groups/fields`);

        const hasComplete = await page.evaluate(() => {
            const controls = Array.from(document.querySelectorAll('input, button'));
            return controls.some(control =>
                (control.value || control.textContent || '').trim() === 'Complete'
            );
        });

        if (hasComplete) {
            await clickVisibleSurveyButton(page, 'Complete');

            // Give SurveyJS a moment to either navigate away or surface
            // required-question validation messages.
            await new Promise(resolve => setTimeout(resolve, 750));

            const validationCount = await page.evaluate(() =>
                Array.from(document.querySelectorAll('*'))
                    .filter(element => (element.textContent || '').trim() === 'Response required.')
                    .length
            );

            if (validationCount === 0) {
                return;
            }

            console.log(`[TEST DEBUG] SurveyJS reported ${validationCount} required response error(s); attempting repair.`);

            const repaired = await fillSurveyValidationErrors(page);
            console.log(`[TEST DEBUG] Repaired ${repaired} required survey question(s).`);

            if (repaired === 0) {
                await logPageDebug(page, 'SurveyJS reported required responses that the helper could not fill');
                throw new Error('Unable to fill one or more required Phase 2 survey responses.');
            }

            await new Promise(resolve => setTimeout(resolve, 250));
            await clickVisibleSurveyButton(page, 'Complete');
            return;
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

        await completeCurrentPhase2Survey(page);

        try {
            await page.waitForSelector(
                'text/Thank you for completing the survey',
                { timeout: TEST_WAIT_TIMEOUT }
            );
        }
        catch (error) {
            await logPageDebug(page, 'CACI Prolific Phase 2 survey did not reach completion screen');
            throw error;
        }

        return;
    }

    // Legacy Phase 1 flow.
    await page.waitForSelector('text/Note that in some scenarios', { timeout: 50000 });
    await clickNext(page);
    await page.waitForSelector('text/Situation', { timeout: 500 });

    let pageNum = 3;
    let medics = 0;
    while (medics < 3) {
        await page.waitForSelector(`text/Page ${pageNum} of`, { timeout: 500 });
        await page.focus('input[type="radio"]');

        for (let i = 0; i < 4; i++) {
            await page.keyboard.press(' ');
            await page.keyboard.press('Tab');
        }

        await clickNext(page);
        medics += 1;
        pageNum += 1;
    }

    await page.waitForSelector('text/Medic-B21 vs Medic-V17', { timeout: 500 });
    await page.waitForSelector('text/Medic-B16 vs Medic-B21', { timeout: 500 });
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

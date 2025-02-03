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
    // needs explicit browser-interaction
    await page.screenshot();
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
    await page.waitForSelector('text/This research was developed');
    let currentUrl = page.url();
    if (currentUrl == `${process.env.REACT_APP_TEST_URL}/awaitingApproval`) {
        await page.$$eval('button', buttons => {
            Array.from(buttons).find(btn => btn.textContent == 'Return to Login').click();
        });
        await page.waitForSelector('text/Sign In');
    }
    else if (![`${process.env.REACT_APP_TEST_URL}/login`, `${process.env.REACT_APP_TEST_URL}/participantText`].includes(currentUrl)) {
        const menu = await page.$('#basic-nav-dropdown');
        await menu.click();
        await page.$$eval('a', buttons => {
            Array.from(buttons).find(btn => btn.textContent == 'Logout').click();
        });
        await page.waitForSelector('text/Sign In', { timeout: 1000 });
    }
    currentUrl = page.url();
    expect(currentUrl).toBe(`${process.env.REACT_APP_TEST_URL}/login`);
}

export async function testRouteRedirection(route, expectedRedirect = '/login', retry = false) {
    let currentUrl = page.url();
    await page.goto(`${process.env.REACT_APP_TEST_URL}${route}`);
    await page.waitForSelector('text/This research was developed');
    currentUrl = page.url();
    // sometimes we may need to retry the redirection if something has caused us to be logged out
    if (!retry && currentUrl != `${process.env.REACT_APP_TEST_URL}${expectedRedirect}`) {
        return false;
    }
    if (retry) {
        console.log(`Retrying ${route} to ${expectedRedirect}`)
    }
    expect(currentUrl).toBe(`${process.env.REACT_APP_TEST_URL}${expectedRedirect}`);
    return true;
}

export async function loginAdmin(page) {
    await logout(page);
    await login(page, 'admin', 'secretAdminPassword123', true);
    await page.waitForSelector('text/Program Questions');
}

export async function loginEvaluator(page) {
    await logout(page);
    await login(page, 'eval', 'secretEvalPassword123', true);
    await page.waitForSelector('text/Program Questions');
}

export async function loginExperimenter(page) {
    await logout(page);
    await login(page, 'exp', 'secretExperimenterPassword123', true);
    await page.waitForSelector('text/Program Questions');
}

export async function loginAdeptUser(page) {
    await logout(page);
    await login(page, 'adept', 'secretAdeptPassword123', true);
    await page.waitForSelector('text/Program Questions');
}

export async function loginBasicApprovedUser(page) {
    await logout(page);
    await login(page, 'basic', 'secretBasicPassword123', true);
    await page.waitForSelector('text/Welcome to the ITM Program!');
}
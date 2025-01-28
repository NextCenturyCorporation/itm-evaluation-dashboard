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

    await emailInput.type(email);
    await usernameInput.type(username);
    await passwordInput.type(password);
    await page.$$eval('.form-group button', buttons => {
        Array.from(buttons).find(btn => btn.textContent == 'Create Account').click();
    });
}

export async function login(page, username, password) {
    const usernameInput = await page.$('input[placeholder="Email / Username"]');
    const passwordInput = await page.$('#password');

    await usernameInput.type(username);
    await passwordInput.type(password);
    await page.$$eval('.form-group button', buttons => {
        Array.from(buttons).find(btn => btn.textContent == 'Sign In').click();
    });
}
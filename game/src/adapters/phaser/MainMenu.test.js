import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MainMenu } from './MainMenu';

vi.mock('phaser', () => ({
    Scene: class { constructor (key) { this.key = key; } }
}));

const userApi = { login: vi.fn(), signUp: vi.fn() };
const sessionManager = { restore: vi.fn(), start: vi.fn(), logout: vi.fn() };

const flush = () => new Promise((resolve) => setTimeout(resolve));

//  Minimal Phaser stand-in: only what MainMenu touches. The form HTML is real DOM (jsdom).
const createScene = (data = {}) => {
    const registryData = { ...data, services: { session: sessionManager, users: userApi } };
    const doms = [];
    const form = { destroy: vi.fn() };
    const logo = { width: 2760, setScale: vi.fn() };
    const inputHandlers = {};

    const scene = new MainMenu();
    scene.registry = {
        get: vi.fn((key) => registryData[key]),
        set: vi.fn((key, value) => { registryData[key] = value; }),
        remove: vi.fn((key) => { delete registryData[key]; })
    };
    scene.add = {
        image: vi.fn((x, y, key) => (key === 'logo' ? logo : {})),
        text: vi.fn(() => ({})),
        dom: vi.fn(() => ({
            createFromHTML: (html) => {
                const root = document.createElement('div');
                root.innerHTML = html;
                const element = html.includes('auth-form') ? form : { destroy: vi.fn() };

                element.node = root; //  like Phaser, node is the wrapper div around the html
                element.getChildByName = (name) => root.querySelector(`[name="${name}"]`);
                doms.push(element);
                return element;
            }
        }))
    };
    scene.tweens = { add: vi.fn() };
    scene.input = {
        once: vi.fn((event, cb) => { inputHandlers[event] = cb; }),
        off: vi.fn((event, cb) => { if (inputHandlers[event] === cb) { delete inputHandlers[event]; } }),
        keyboard: { disableGlobalCapture: vi.fn() }
    };
    scene.scene = { start: vi.fn() };
    scene.sys = { isActive: vi.fn(() => true) };

    const welcomeTitle = () => doms.map((d) => d.node.querySelector('.welcome-title')).find(Boolean)?.textContent;
    const message = () => ({ text: scene.message.textContent, isError: scene.message.classList.contains('error') });

    const logoutButton = () => doms.map((d) => d.node.querySelector('[name="logout"]')).find(Boolean);

    return { scene, form, logo, doms, welcomeTitle, logoutButton, message, inputHandlers, registryData };
};

const fill = (form, username, password) => {
    form.getChildByName('username').value = username;
    form.getChildByName('password').value = password;
};

//  Creates the scene and waits for the session restore to settle
const open = async (scene) => {
    scene.create();
    await flush();
};

const authResponse = (user) => ({
    user,
    accessToken: 'access',
    refreshToken: 'refresh',
    accessTokenExpiresAt: 3,
    refreshTokenExpiresAt: 4
});

beforeEach(() => {
    vi.mocked(userApi.login).mockReset();
    vi.mocked(userApi.signUp).mockReset();
    vi.mocked(sessionManager.restore).mockReset().mockResolvedValue({ status: 'none' });
    vi.mocked(sessionManager.start).mockReset();
    vi.mocked(sessionManager.logout).mockReset().mockResolvedValue(undefined);
});

describe('MainMenu authentication', () => {
    it('shows the auth form when there is no logged in user', async () => {
        const { scene, form } = createScene({ highscore: 0 });

        await open(scene);

        expect(scene.add.dom).toHaveBeenCalled();
        expect(form.getChildByName('login')).not.toBeNull();
        expect(form.getChildByName('signup')).not.toBeNull();
    });

    it('skips the form and greets a user that is already logged in', () => {
        const { scene, form, welcomeTitle, inputHandlers } = createScene({ highscore: 3, user: { username: 'yan' } });

        scene.create();

        expect(sessionManager.restore).not.toHaveBeenCalled();
        expect(form.node).toBeUndefined();
        expect(welcomeTitle()).toBe('Hello, yan!');

        inputHandlers.pointerdown();
        expect(scene.scene.start).toHaveBeenCalledWith('ClickerGame');
    });

    it('does not call the api when a field is empty', async () => {
        const { scene, form, message } = createScene({ highscore: 0 });
        await open(scene);
        fill(form, '  ', '');

        form.getChildByName('login').click();
        await flush();

        expect(userApi.login).not.toHaveBeenCalled();
        expect(message()).toEqual({ text: 'Enter username and password', isError: true });
    });

    it('logs in, starts the session, stores the user in the registry and moves to the welcome state', async () => {
        const user = { username: 'yan', createdAt: 1, lastLoginAt: 2 };
        const response = authResponse(user);
        vi.mocked(userApi.login).mockResolvedValue(response);
        const { scene, form, registryData, message, welcomeTitle } = createScene({ highscore: 0 });
        await open(scene);
        fill(form, ' yan ', 'secret123');

        form.getChildByName('login').click();
        await flush();

        expect(userApi.login).toHaveBeenCalledWith('yan', 'secret123');
        expect(sessionManager.start).toHaveBeenCalledWith(response);
        expect(registryData.user).toEqual(user);
        expect(message()).toEqual({ text: 'Welcome back, yan!', isError: false });
        expect(welcomeTitle()).toBe('Hello, yan!');
        expect(form.destroy).toHaveBeenCalled();
        expect(scene.input.once).toHaveBeenCalledWith('pointerdown', expect.any(Function));
    });

    const chooseHero = (form, element) => {
        form.node.querySelector(`input[name="startingElement"][value="${element}"]`).checked = true;
    };

    it('offers fire, water and nature as the first hero, each with its portrait', async () => {
        const { scene, form } = createScene({ highscore: 0 });
        await open(scene);

        const choices = [ ...form.node.querySelectorAll('.hero-choice') ];

        expect(choices.map((choice) => choice.querySelector('input').value)).toEqual([ 'FIRE', 'WATER', 'NATURE' ]);
        expect(choices.map((choice) => choice.querySelector('span').textContent)).toEqual([ 'Fogo - Kael', 'Água - Orina', 'Natureza - Lyra' ]);
        expect(choices.map((choice) => choice.querySelector('img').getAttribute('src'))).toEqual([
            'assets/heroes/kael_position.jpg', 'assets/heroes/orina_position.jpg', 'assets/heroes/lyra_position.jpg'
        ]);
        expect(choices.some((choice) => choice.querySelector('input').checked)).toBe(false);
    });

    it('signs up with the element of the chosen hero', async () => {
        vi.mocked(userApi.signUp).mockResolvedValue(authResponse({ username: 'ana', createdAt: 1, lastLoginAt: 1 }));
        const { scene, form } = createScene({ highscore: 0 });
        await open(scene);
        fill(form, 'ana', 'secret123');
        chooseHero(form, 'WATER');

        form.getChildByName('signup').click();
        await flush();

        expect(userApi.signUp).toHaveBeenCalledWith('ana', 'secret123', 'WATER');
    });

    it('signing up with no hero chosen shows the choice message, sends no request and re-enables the buttons', async () => {
        const { scene, form, message } = createScene({ highscore: 0 });
        await open(scene);
        fill(form, 'ana', 'secret123');

        form.getChildByName('signup').click();
        await flush();

        expect(userApi.signUp).not.toHaveBeenCalled();
        expect(message()).toEqual({ text: 'Escolha seu herói inicial.', isError: true });
        expect(form.getChildByName('signup').disabled).toBe(false);
        expect(form.getChildByName('login').disabled).toBe(false);
    });

    it('logging in needs no hero', async () => {
        vi.mocked(userApi.login).mockResolvedValue(authResponse({ username: 'yan' }));
        const { scene, form } = createScene({ highscore: 0 });
        await open(scene);
        fill(form, 'yan', 'secret123');

        form.getChildByName('login').click();
        await flush();

        expect(userApi.login).toHaveBeenCalledWith('yan', 'secret123');
        expect(userApi.signUp).not.toHaveBeenCalled();
    });

    it('signs up through the sign up button', async () => {
        const user = { username: 'newbie', createdAt: 1, lastLoginAt: 1 };
        const response = authResponse(user);
        vi.mocked(userApi.signUp).mockResolvedValue(response);
        const { scene, form, registryData, message } = createScene({ highscore: 0 });
        await open(scene);
        fill(form, 'newbie', 'secret123');
        chooseHero(form, 'FIRE');

        form.getChildByName('signup').click();
        await flush();

        expect(userApi.signUp).toHaveBeenCalledWith('newbie', 'secret123', 'FIRE');
        expect(userApi.login).not.toHaveBeenCalled();
        expect(sessionManager.start).toHaveBeenCalledWith(response);
        expect(registryData.user).toEqual(user);
        expect(message()).toEqual({ text: 'Account created, newbie!', isError: false });
    });

    it('shows the error and re-enables the buttons when the request fails', async () => {
        vi.mocked(userApi.login).mockRejectedValue(new Error('Password is invalid'));
        const { scene, form, registryData, message } = createScene({ highscore: 0 });
        await open(scene);
        fill(form, 'yan', 'wrong-pass');

        form.getChildByName('login').click();
        expect(form.getChildByName('login').disabled).toBe(true);
        await flush();

        expect(message()).toEqual({ text: 'Password is invalid', isError: true });
        expect(form.getChildByName('login').disabled).toBe(false);
        expect(form.getChildByName('signup').disabled).toBe(false);
        expect(registryData.user).toBeUndefined();
        expect(sessionManager.start).not.toHaveBeenCalled();
        expect(form.destroy).not.toHaveBeenCalled();
    });

    it('ignores a response that arrives after the scene was left', async () => {
        vi.mocked(userApi.login).mockResolvedValue(authResponse({ username: 'yan' }));
        const { scene, form, registryData } = createScene({ highscore: 0 });
        await open(scene);
        fill(form, 'yan', 'secret123');
        scene.sys.isActive.mockReturnValue(false);

        form.getChildByName('login').click();
        await flush();

        expect(registryData.user).toBeUndefined();
        expect(form.destroy).not.toHaveBeenCalled();
    });
});

describe('MainMenu session restore', () => {
    const user = { username: 'yan', createdAt: 1, lastLoginAt: 2 };

    it('shows a pending status while the session is being restored', () => {
        vi.mocked(sessionManager.restore).mockReturnValue(new Promise(() => {}));
        const { scene, message } = createScene({ highscore: 0 });

        scene.create();

        expect(message()).toEqual({ text: '...', isError: false });
    });

    it('greets the stored user without rendering the form when the session is active', async () => {
        vi.mocked(sessionManager.restore).mockResolvedValue({ status: 'active', user });
        const { scene, form, registryData, welcomeTitle, inputHandlers } = createScene({ highscore: 0 });

        await open(scene);

        expect(registryData.user).toEqual(user);
        expect(welcomeTitle()).toBe('Hello, yan!');
        expect(form.node).toBeUndefined();
        expect(inputHandlers.pointerdown).toEqual(expect.any(Function));
    });

    it('shows the form when there is no session', async () => {
        vi.mocked(sessionManager.restore).mockResolvedValue({ status: 'none' });
        const { scene, form, registryData, welcomeTitle } = createScene({ highscore: 0 });

        await open(scene);

        expect(form.getChildByName('login')).not.toBeNull();
        expect(welcomeTitle()).toBeUndefined();
        expect(registryData.user).toBeUndefined();
    });

    it('shows the form and the error message when the server is unreachable', async () => {
        vi.mocked(sessionManager.restore).mockResolvedValue({ status: 'offline', message: 'Cannot reach the server. Try again later.' });
        const { scene, form, message, registryData } = createScene({ highscore: 0 });

        await open(scene);

        expect(form.getChildByName('login')).not.toBeNull();
        expect(message()).toEqual({ text: 'Cannot reach the server. Try again later.', isError: true });
        expect(registryData.user).toBeUndefined();
    });

    it('does nothing when the scene is left while the restore is pending', async () => {
        let resolve;
        vi.mocked(sessionManager.restore).mockReturnValue(new Promise((r) => { resolve = r; }));
        const { scene, registryData, welcomeTitle } = createScene({ highscore: 0 });
        scene.create();
        const domCount = scene.add.dom.mock.calls.length;
        scene.sys.isActive.mockReturnValue(false);

        resolve({ status: 'active', user });
        await flush();

        expect(registryData.user).toBeUndefined();
        expect(welcomeTitle()).toBeUndefined();
        expect(scene.add.dom.mock.calls.length).toBe(domCount);
    });
});

describe('MainMenu logout', () => {
    const loggedIn = () => createScene({ highscore: 0, user: { username: 'yan' } });

    it('renders a Logout button in the welcome state', () => {
        const { scene, logoutButton } = loggedIn();

        scene.create();

        expect(logoutButton().textContent).toBe('Logout');
        expect(logoutButton().tagName).toBe('BUTTON');
    });

    it('does not render a Logout button in the auth form state', async () => {
        const { scene, logoutButton } = createScene({ highscore: 0 });

        await open(scene);

        expect(logoutButton()).toBeUndefined();
    });

    it('logs out once, clears the user, destroys the welcome and shows the form', async () => {
        const { scene, form, doms, logoutButton, registryData, message } = loggedIn();
        scene.create();
        const welcomeDoms = doms.filter((d) => d.node.querySelector('.welcome-title') || d.node.querySelector('[name="logout"]'));

        logoutButton().click();
        await flush();

        expect(sessionManager.logout).toHaveBeenCalledTimes(1);
        expect(registryData.user).toBeUndefined();
        expect(welcomeDoms.every((d) => d.destroy.mock.calls.length === 1)).toBe(true);
        expect(welcomeDoms).toHaveLength(2);
        expect(form.getChildByName('login')).not.toBeNull();
        expect(message()).toEqual({ text: '', isError: false });
    });

    it('still shows the form when the logout request rejects', async () => {
        vi.mocked(sessionManager.logout).mockRejectedValue(new Error('boom'));
        const { scene, form, logoutButton, registryData } = loggedIn();
        scene.create();

        logoutButton().click();
        await flush();

        expect(registryData.user).toBeUndefined();
        expect(form.getChildByName('login')).not.toBeNull();
    });

    it('does not start the game when logging out, even on a later canvas click', async () => {
        const { scene, logoutButton, inputHandlers } = loggedIn();
        scene.create();

        logoutButton().click();
        await flush();

        expect(inputHandlers.pointerdown).toBeUndefined();
        expect(scene.scene.start).not.toHaveBeenCalled();
    });
});

describe('MainMenu logo', () => {
    it('scales the logo to 400 px wide and drops it to y = 150', () => {
        const { scene, logo } = createScene({ highscore: 0 });

        scene.create();

        expect(logo.setScale).toHaveBeenCalledWith(400 / 2760);
        expect(scene.tweens.add).toHaveBeenCalledWith(expect.objectContaining({ targets: logo, y: 150, duration: 1000, ease: 'Bounce' }));
    });

    it('starts the logo above the visible canvas', () => {
        const { scene } = createScene({ highscore: 0 });

        scene.create();

        const [ , y ] = scene.add.image.mock.calls.find(([ , , key ]) => key === 'logo');
        expect(y).toBeLessThan(0);
    });
});

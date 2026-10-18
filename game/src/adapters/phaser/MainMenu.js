import { Scene } from 'phaser';
import { STARTING_CHOICES } from '../../domain/heroes/heroes';

const CHOOSE_PATH_TEXT = 'Escolha seu caminho';
const TAGLINE_TEXT = 'Defenda a Grande Árvore das hordas do Submundo.';

//  Everything the player reads or clicks sits in a cream oval on the left; x is the centre of that column
const COLUMN_X = 216;
const OVAL = { x: 170, y: 380, width: 700, height: 1040, color: 0xf5ead8, shadow: 0x2e2b25 };

//  The five heroes stand on the right, back to front; x is the centre of the feet, y the ground line
const LINEUP = [
    { id: 'vex', x: 570, y: 734, height: 340 },
    { id: 'seraphine', x: 680, y: 738, height: 360 },
    { id: 'lyra', x: 940, y: 734, height: 370 },
    { id: 'orina', x: 850, y: 746, height: 350 },
    { id: 'kael', x: 740, y: 754, height: 360 }
];
const OTHER_HEROES_TEXT = 'Os outros personagens podem ser encontrados no decorrer do jogo.';

const FORM_HTML = `
    <div class="auth-form">
        <input type="text" name="username" placeholder="Username" autocomplete="username" />
        <input type="password" name="password" placeholder="Password" autocomplete="current-password" />
        <div class="auth-actions">
            <button type="button" name="login">Login</button>
            <button type="button" name="signup">Sign up</button>
        </div>
    </div>
`;

//  The screen after Sign up: the first hero of the new account, one button per starting element
const PATH_HTML = `
    <div class="path-choice">
        <h2 class="path-title">${CHOOSE_PATH_TEXT}</h2>
        <div class="path-options">${STARTING_CHOICES.map(({ element, heroId, label }) => `
            <button type="button" class="path-option" data-element="${element}" data-testid="path-${element}">
                <img src="assets/heroes/${heroId}_sprite.png" alt="${label}" />
                <span>${label}</span>
            </button>`).join('')}
        </div>
        <p class="path-hint">${OTHER_HEROES_TEXT}</p>
        <button type="button" class="path-back" data-testid="path-back">Voltar</button>
    </div>
`;

const TAGLINE_HTML = `<p class="menu-tagline">${TAGLINE_TEXT}</p>`;

const MESSAGE_HTML = '<p class="auth-message" role="alert"></p>';

const PLAY_ICON = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2.75" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>';
const LOGOUT_ICON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" x2="9" y1="12" y2="12"></line></svg>';

const WELCOME_HTML = `
    <div class="welcome">
        <p class="welcome-title"></p>
        <p class="welcome-start">Click to Start!${PLAY_ICON}</p>
    </div>
`;

const LOGOUT_HTML = `<button type="button" class="logout" name="logout">${LOGOUT_ICON}Logout</button>`;

export class MainMenu extends Scene
{
    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        ({ session: this.session, users: this.users } = this.registry.get('services'));

        this.add.image(512, 384, 'background');
        this.addLineup();

        //  The oval drops a soft shadow on the forest
        this.add.ellipse(OVAL.x + 6, OVAL.y + 12, OVAL.width, OVAL.height, OVAL.shadow, 0.22);
        this.add.ellipse(OVAL.x, OVAL.y, OVAL.width, OVAL.height, OVAL.color);

        //  Scaled to 400 px wide; start above the canvas, rest at y = 150
        const logo = this.add.image(COLUMN_X, -150, 'logo');
        logo.setScale(400 / logo.width);

        this.tweens.add({
            targets: logo,
            y: 150,
            duration: 1000,
            ease: 'Bounce'
        });

        //  Status line is real HTML (not canvas text) so it is visible to assistive tech and e2e locators
        this.add.dom(COLUMN_X + 20, 300).createFromHTML(TAGLINE_HTML).pointerEvents = 'none';

        const message = this.add.dom(COLUMN_X + 10, 560).createFromHTML(MESSAGE_HTML);
        message.pointerEvents = 'none';
        this.message = message.node.querySelector('.auth-message');

        const user = this.registry.get('user');

        if (user)
        {
            this.showWelcome(user);
        }
        else
        {
            this.restoreSession();
        }
    }

    //  The heroes of the game in a group on the ground, each scaled to its height
    addLineup ()
    {
        LINEUP.forEach(({ id, x, y, height }) => {

            const hero = this.add.image(x, y, `hero_${id}`).setOrigin(0.5, 1);

            hero.setScale(height / hero.height);

        });
    }

    async restoreSession ()
    {
        this.showMessage('...');

        const result = await this.session.restore();

        //  Scene may have been left while the restore was in flight
        if (!this.sys.isActive()) { return; }

        if (result.status === 'active')
        {
            this.registry.set('user', result.user);
            this.showMessage('');
            this.showWelcome(result.user);
            return;
        }

        this.showMessage(result.status === 'offline' ? result.message : '', result.status === 'offline');
        this.showAuthForm();
    }

    showAuthForm ()
    {
        const form = this.add.dom(COLUMN_X, 430).createFromHTML(FORM_HTML);
        const username = form.getChildByName('username');
        const password = form.getChildByName('password');
        const buttons = [ form.getChildByName('login'), form.getChildByName('signup') ];

        const submit = async (request, successMessage) => {

            if (!username.value.trim() || !password.value)
            {
                this.showMessage('Enter username and password', true);
                return false;
            }

            buttons.forEach((button) => { button.disabled = true; });
            this.showMessage('...');

            try
            {
                const response = await request(username.value.trim(), password.value);

                //  Scene may have been left while the request was in flight
                if (!this.sys.isActive()) { return true; }

                this.session.start(response);
                this.registry.set('user', response.user);
                this.showMessage(successMessage(response.user));
                form.destroy();
                this.showWelcome(response.user);

                return true;
            }
            catch (error)
            {
                if (!this.sys.isActive()) { return false; }

                this.showMessage(error.message, true);
                buttons.forEach((button) => { button.disabled = false; });

                return false;
            }
        };

        buttons[0].addEventListener('click', () => submit(this.users.login, (u) => `Welcome back, ${u.username}!`));

        //  Sign up first checks the credentials, then asks for the first hero on a screen of its own; the account is created by that choice
        buttons[1].addEventListener('click', () => {

            if (!username.value.trim() || !password.value)
            {
                this.showMessage('Enter username and password', true);
                return;
            }

            this.showMessage('');
            this.showPathChoice(form, (element) => submit((name, pass) => this.users.signUp(name, pass, element), (u) => `Account created, ${u.username}!`));
        });

        //  Enter in either field logs in (click() is a no-op while the button is disabled)
        [ username, password ].forEach((input) => {
            input.addEventListener('keydown', (event) => {
                if (event.key === 'Enter')
                {
                    buttons[0].click();
                }
            });
        });

        //  Phaser keyboard captures would swallow typing otherwise
        this.input.keyboard.disableGlobalCapture();
    }

    //  Hides the form while the player picks the first hero; a click on a hero runs `choose(element)`, Voltar or a failure brings the form back
    showPathChoice (form, choose)
    {
        form.setVisible(false);

        const path = this.add.dom(512, 470).createFromHTML(PATH_HTML);
        const options = [ ...path.node.querySelectorAll('.path-option') ];
        const back = () => {

            path.destroy();
            form.setVisible(true);

        };

        options.forEach((option) => option.addEventListener('click', async () => {

            options.forEach((other) => { other.disabled = true; });

            if (await choose(option.dataset.element))
            {
                path.destroy();
                return;
            }

            if (this.sys.isActive())
            {
                back();
            }
        }));

        path.node.querySelector('.path-back').addEventListener('click', () => {

            back();
            this.showMessage('');

        });
    }

    showWelcome (user)
    {
        const welcome = this.add.dom(COLUMN_X + 10, 420).createFromHTML(WELCOME_HTML);
        welcome.pointerEvents = 'none';
        welcome.node.querySelector('.welcome-title').textContent = `Hello, ${user.username}!`;

        //  Own DOM element: the welcome block is click-through, the button must receive clicks
        const logout = this.add.dom(COLUMN_X, 515).createFromHTML(LOGOUT_HTML);

        const start = () => {

            this.scene.start('ClickerGame');

        };

        this.input.once('pointerdown', start);

        logout.getChildByName('logout').addEventListener('click', async (event) => {

            event.currentTarget.disabled = true;
            this.input.off('pointerdown', start);

            //  logout() clears the local session even when the server call fails
            await this.session.logout().catch(() => {});

            if (!this.sys.isActive()) { return; }

            this.registry.remove('user');
            welcome.destroy();
            logout.destroy();
            this.showMessage('');
            this.showAuthForm();
        });
    }

    showMessage (text, isError = false)
    {
        this.message.textContent = text;
        this.message.classList.toggle('error', isError);
    }
}

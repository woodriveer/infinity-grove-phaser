import { Scene } from 'phaser';
import { STARTING_CHOICES } from '../../domain/heroes/heroes';

const CHOOSE_PATH_TEXT = 'Escolha seu caminho';
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

const MESSAGE_HTML = '<p class="auth-message" role="alert"></p>';

const WELCOME_HTML = `
    <div class="welcome">
        <p class="welcome-title"></p>
        <p>Click to Start!</p>
    </div>
`;

const LOGOUT_HTML = '<button type="button" class="logout" name="logout">Logout</button>';

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

        //  Source art is 2760 px wide; start above the canvas, rest at y = 150
        const logo = this.add.image(512, -150, 'logo');
        logo.setScale(400 / logo.width);

        this.tweens.add({
            targets: logo,
            y: 150,
            duration: 1000,
            ease: 'Bounce'
        });

        //  Status line is real HTML (not canvas text) so it is visible to assistive tech and e2e locators
        const message = this.add.dom(512, 700).createFromHTML(MESSAGE_HTML);
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
        const form = this.add.dom(512, 540).createFromHTML(FORM_HTML);
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
        const welcome = this.add.dom(512, 550).createFromHTML(WELCOME_HTML);
        welcome.pointerEvents = 'none';
        welcome.node.querySelector('.welcome-title').textContent = `Hello, ${user.username}!`;

        //  Own DOM element: the welcome block is click-through, the button must receive clicks
        const logout = this.add.dom(512, 640).createFromHTML(LOGOUT_HTML);

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

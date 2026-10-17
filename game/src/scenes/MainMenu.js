import { Scene } from 'phaser';
import { userApi } from '../api';
import { sessionManager } from '../auth/sessionManager';

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

const MESSAGE_HTML = '<p class="auth-message" role="alert"></p>';

const WELCOME_HTML = `
    <div class="welcome">
        <p class="welcome-title"></p>
        <p>Click to Start!</p>
    </div>
`;

export class MainMenu extends Scene
{
    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        //  Get the current highscore from the registry
        const score = this.registry.get('highscore');

        const textStyle = { fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff', stroke: '#000000', strokeThickness: 8 };

        this.add.image(512, 384, 'background');

        const logo = this.add.image(512, -270, 'logo');

        this.tweens.add({
            targets: logo,
            y: 270,
            duration: 1000,
            ease: 'Bounce'
        });

        this.add.text(32, 32, `High Score: ${score}`, textStyle);

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

        const result = await sessionManager.restore();

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
                return;
            }

            buttons.forEach((button) => { button.disabled = true; });
            this.showMessage('...');

            try
            {
                const response = await request(username.value.trim(), password.value);

                //  Scene may have been left while the request was in flight
                if (!this.sys.isActive()) { return; }

                sessionManager.start(response);
                this.registry.set('user', response.user);
                this.showMessage(successMessage(response.user));
                form.destroy();
                this.showWelcome(response.user);
            }
            catch (error)
            {
                if (!this.sys.isActive()) { return; }

                this.showMessage(error.message, true);
                buttons.forEach((button) => { button.disabled = false; });
            }
        };

        buttons[0].addEventListener('click', () => submit(userApi.login, (u) => `Welcome back, ${u.username}!`));
        buttons[1].addEventListener('click', () => submit(userApi.signUp, (u) => `Account created, ${u.username}!`));

        //  Phaser keyboard captures would swallow typing otherwise
        this.input.keyboard.disableGlobalCapture();
    }

    showWelcome (user)
    {
        const welcome = this.add.dom(512, 550).createFromHTML(WELCOME_HTML);
        welcome.pointerEvents = 'none';
        welcome.node.querySelector('.welcome-title').textContent = `Hello, ${user.username}!`;

        this.input.once('pointerdown', () => {

            this.scene.start('ClickerGame');

        });
    }

    showMessage (text, isError = false)
    {
        this.message.textContent = text;
        this.message.classList.toggle('error', isError);
    }
}

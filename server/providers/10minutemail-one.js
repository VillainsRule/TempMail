import axios from 'axios';
import events from 'events';

export default class Provider {
    root = '10minutemail.one';

    events;

    created;
    email;
    token;

    constructor() {
        this.events = new events.EventEmitter();
        this.events.setMaxListeners(Infinity);

        this.createEmail();
    };
    
    async createEmail() {
        const tokenRequest = await axios.get(`https://${this.root}/`);
        this.token = tokenRequest.data.match(/<meta name="csrf-token" content="(.+?)">/)[1];
        this.created = true;

        console.log(this.token);

        const emailRequest = await axios.post(`https://${this.root}/messages?${Date.now}`, `_token=${this.token}&captcha=`, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            }
        });

        console.log(this.token);

        this.email = emailRequest.data.mailbox;
        this.events.emit('createEmail', this.email);
        
        return this.token;
    };

    async getMessages() {
        if (!this.created) {
            console.log('Has not created email.')
            await this.createEmail();
        };

        console.log(this.token);

        const res = await axios.post(`https://${this.root}/messages?${Date.now}`, `_token=${this.token}&captcha=`, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            }
        });

        console.log(res.data);
    };
};
import express from 'express';

import session from 'express-session';
import crypto from 'crypto';

import * as _provider_2 from './providers/1secmail-com.js';
import * as _provider_3 from './providers/minuteinbox-com.js';
import * as _provider_4 from './providers/tempmail-plus.js';

const Providers = {
    OneSecMail: 1,
    MinuteInbox: 2,
    DisposableMail: 3,
    TempMailPlus: 4
};

const app = express();
app.set('trust proxy', 1);

app.use(session({
    secret: crypto.randomBytes(20).toString('hex'),
    genid: (req) => crypto.randomBytes(20).toString('hex'),
    name: 'tm_id_1',
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 600000 }
}));

app.use((req, res, next) => {
    if (req.session.email) {
        if (req.session.user.expiry < new Date().getTime()) {
            req.session.destroy();
            return res.redirect('/');
        }
    }
    next();
});

app.use((req, res, next) => {
    let ip = req.headers['cf-connecting-ip'] || req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (!req.session.user) {
        req.session.user = {
            expiry: 0
        };
    }
    if (!req.session.user.fingerprint) {
        req.session.user.fingerprint = crypto.createHash('md5').update(JSON.stringify({
            ip: crypto.createHash('sha256').update(ip).digest('hex'),
            ua: req.headers['user-agent']
        })).digest('hex');
        req.session.save();
    }
    req.session.save();
    next();
});

class Generator {
    #prov;
    #res = {};

    constructor(provider, optional_res = {}) {
        this.#prov = provider;
        this.#res = optional_res;
    }

    async #generate_1sm() {
        return await _provider_2.Email.generate();
    }

    async #generate_mi() {
        return await _provider_3.Email.generate(_provider_3.Host.MinuteInbox);
    }

    async #generate_dm() {
        return await _provider_3.Email.generate(_provider_3.Host.DisposableMail);
    }

    async #generate_tmp() {
        return await _provider_4.getEmails();
    }

    async generate() {
        switch (this.#prov) {
            case 1:
                return await this.#generate_1sm();
            case 2:
                return await this.#generate_mi();
            case 3:
                return await this.#generate_dm();
            case 4:
                return await this.#generate_tmp();
            default:
                return await this.#generate_1sm();
        }
    }
}

app.get('/api/tl', async (req, res) => {
    let email = req.session.user.email;
    let expiry = req.session.user.expiry;
    let tl = expiry - new Date().getTime();
    if (!email) {
        res.json({ error: 'no email in current session.' });
        return;
    }
    if (!expiry) {
        res.json({ error: 'no expiry in current session.' });
        return;
    }
    req.session.user.timeLeft = tl;
    return res.json({ timeLeft: tl });
});

app.get('/api/get', async (req, res) => {
    let email = req.session.user.email;
    if (!email) {
        res.json({ error: 'no email in current session.' });
        return;
    }
    return res.send({
        email: email.email,
        host: parseInt(req.session.user.host),
        mail: email.mail,
        expiry: req.session.user.expiry,
        timeLeft: email.timeLeft
    });
});

app.get('/api/me', async (req, res) => {
    let email = req.session.user.email;
    let expiry = req.session.user.expiry;
    let tl = expiry - new Date().getTime();
    if (tl <= 0) {
        res.json({ error: 'session expired.' });
        return;
    }
    if (!email) {
        res.json({ error: 'no email in current session.' });
        return;
    }
    return res.send({
        hasEmail: email.email !== null && email.email !== undefined,
        email: email.email,
        messages: email.mail,
    });
});

app.get('/api/content', async (req, res) => {
    let email = req.session.user.email;
    let id = req.query.id;
    if (!email) {
        res.json({ error: 'no email in current session.' });
        return;
    }
    if (id === undefined || id === null) {
        res.json({ error: 'no id provided.' });
        return;
    }
    switch (parseInt(req.session.user.host)) {
        case 1:
            res.send((await _provider_2.Email.readMessageById(email, id)).body);
            break;
        case 2:
            res.send(await _provider_3.Email.getEmailContent(email, id));
            break;
        case 3:
            res.send(await _provider_3.Email.getEmailContent(email, id));
            break;
        case 4:
            res.send(await _provider_4.getEmailContent(email, id));
            break;
        default:
            res.json({ error: 'invalid host.' });
            break;
    }
});

app.get('/api/messages', async (req, res) => {
    if (!req.session.user) {
        res.json({ error: 'no session.' });
        return;
    }
    if (!req.session.user.email) {
        res.json({ error: 'no email in current session.' });
        return;
    }
    let email = req.session.user.email.email;
    let host = parseInt(req.session.user.host);
    if (!email) {
        res.json({ error: 'no email in current session.' });
        return;
    }
    if (host === undefined || host === null) {
        res.json({ error: 'no host in current session.' });
        return;
    }
    if (host < 1 || host > 4) {
        res.json({ error: 'invalid host.' });
        return;
    }
    let m = [];
    if (host !== 2 && host !== 3) {
        m.push({
            id: 0,
            from: 'Admin <Admin@tempmail.villainsrule.xyz>',
            to: 'Me <' + email.email + '>',
            title: {
                preview: 'Welcome to TempMail.',
                full: 'Welcome to TempMail.'
            },
            date: new Date().toLocaleTimeString(),
            state: 'new'
        });
    }
    switch (host) {
        case 1:
            m = m.concat(await _provider_2.Email.refresh(req.session.user.email));
            break;
        case 2:
            m = m.concat(await _provider_3.Email.emails(req.session.user.email));
            break;
        case 3:
            m = m.concat(await _provider_3.Email.emails(req.session.user.email));
            break;
        case 4:
            m = m.concat(await _provider_4.getEmails(req.session.user.email));
            break;
    };
    req.session.user.email.mail = m;
    req.session.save((e) => {
        return res.json(m);
    });
});

let refs = [];
let indR = 0;

app.get('/api/shuffle/:server', async (req, res) => {
    let server = parseInt(req.params.server) || Providers.TenMinuteMail;
    if (server < 1 || server > 4) {
        res.json({ error: 'invalid server.' });
        return;
    }
    if (req.session.user && req.session.user.expiry && req.session.user.expiry > new Date().getTime() && server === parseInt(req.session.user.host)) {
        res.json({ error: 'please wait before shuffling again.' });
        return;
    }
    let gen = new Generator(server, res);
    let email = await gen.generate();
    if (!email.mail || !Array.isArray(email.mail)) {
        email.mail = [];
    }
    if (!(server === 2) && !(server === 3)) {
        email.mail.push({
            id: 0,
            from: 'Admin <Admin@tempmail.villainsrule.xyz>',
            to: 'Me <' + email.email + '>',
            title: {
                preview: 'Welcome to TempMail.',
                full: 'Welcome to TempMail.'
            },
            date: new Date().toLocaleTimeString(),
            state: 'new'
        });
    }
    req.session.user = {
        email,
        host: server.toString(),
        expiry: new Date().getTime() + 600000,
        timeLeft: 600000,
        ref: indR
    };
    refs.push({
        ind: indR,
        f: email.ref
    });
    indR++;
    req.session.save((e) => {
        res.json({ success: true, email: req.session.user.email.email, mail: req.session.user.email.mail, host: parseInt(req.session.user.host), expiry: req.session.user.expiry, now: new Date().getTime() });
    });
});


app.listen(5100, () => console.log('Server started!'));
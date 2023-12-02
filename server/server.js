import express from 'express';

import session from 'express-session';
import crypto from 'crypto';

import _provider_1 from './providers/10minutemail-one.js';
import * as _provider_2 from './providers/1secmail-com.js';
import * as _provider_3 from './providers/minuteinbox-com.js';

// pointless declarative types (will be useful for a potential "switch servers" button on the frontend)
const Providers = {
    TenMinuteMail: 0,
    OneSecMail: 1,
    MinuteInbox: 2,
    DisposableMail: 3
};

const app = express();
app.set('trust proxy', 1);


app.use(session({
    secret: crypto.randomBytes(20).toString('hex'),
    genid: (req) => {
        return crypto.randomBytes(20).toString('hex');
    },
    name: 'tm_id_1',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true, maxAge: 600000 }
}));

app.use((req, res, next) => {
    if (req.session.email) {
        if (req.session.user.expiry < new Date().getTime()) {
            console.log("session expired.");
            req.session.destroy();
            return res.redirect("/");
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

    async #generate_10mm() {
        let mail = new _provider_1();
        return new Promise(res => mail.events.on('createEmail', async (email) => {
            let m = await mail.getMessages();
            res({
                email: email,
                messages: m,
                host: "https://10minutemail.one",
                ref: mail
            });
        }));
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

    async generate() {
        switch (this.#prov) {
            case 0:
                return await this.#generate_10mm();
            case 1:
                return await this.#generate_1sm();
            case 2:
                return await this.#generate_mi();
            case 3:
                return await this.#generate_dm();
            default:
                return await this.#generate_10mm();
        }
    }
}

app.get("/api/get", async (req, res) => {
    let email = req.session.user.email;
    if (!email) {
        res.json({ error: "no email in current session." });
        return;
    }
    return res.send({
        email: email.email,
        host: parseInt(email.host),
        mail: email.mail,
        expiry: email.expiry,
        timeLeft: email.timeLeft
    });
});

app.get("/api/content", async (req, res) => {
    let email = req.session.user.email;
    let id = req.query.id;
    if (!email) {
        res.json({ error: "no email in current session." });
        return;
    }
    if (id === undefined || id === null) {
        res.json({ error: "no id provided." });
        return;
    }
    if (id < 1 || id > 3) {
        res.json({ error: "invalid id." });
        return;
    }
    switch (id) {
        case 1:
            res.json(await _provider_2.Email.readMessageById(email, id));
            break;
        case 2:
            res.json(await _provider_3.Email.getEmailContent(email, id));
            break;
        case 3:
            res.json(await _provider_3.Email.getEmailContent(email, id));
            break;
    }
});

app.get("/api/messages", async (req, res) => {
    if (!req.session.user) {
        res.json({ error: "no session." });
        return;
    }
    if (!req.session.user.email) {
        res.json({ error: "no email in current session." });
        return;
    }
    let email = req.session.user.email.email;
    let host = parseInt(req.session.user.host);
    if (!email) {
        res.json({ error: "no email in current session." });
        return;
    }
    if (host === undefined || host === null) {
        res.json({ error: "no host in current session." });
        return;
    }
    if (host < 0 || host > 3) {
        res.json({ error: "invalid host." });
        return;
    }
    switch (host) {
        case 0:
            req.session.user.email.mail = await refs[req.session.user.ref].f.getMessages();
            break;
        case 1:
            req.session.user.email.mail = await _provider_2.Email.refresh(email);
            break;
        case 2:
            req.session.user.email.mail = await _provider_3.Email.emails(email);
            break;
        case 3:
            req.session.user.email.mail = await _provider_3.Email.emails(email);
            break;
    };
    req.session.save((e) => {
        return res.json(req.session.user.email.mail);
    });
});

let refs = [];
let indR = 0;

app.get("/api/shuffle/:server", async (req, res) => {
    let server = parseInt(req.params.server) || Providers.TenMinuteMail;
    if (server < 0 || server > 3) {
        res.json({ error: "invalid server." });
        return;
    }
    if (req.session.user && req.session.user.expiry && req.session.user.expiry > new Date().getTime()) {
        res.json({ error: "please wait before shuffling again." });
        return;
    }
    let gen = new Generator(server, res);
    let email = await gen.generate();
    req.session.user = {
        email,
        host: server.toString(),
        expiry: new Date().getTime() + 600000,
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
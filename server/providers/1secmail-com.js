import { request } from 'undici';
import fs from 'fs';
import { JSDOM } from 'jsdom';

let file;
if (!fs.existsSync("1s_labels.json"))
  fs.writeFileSync("1s_labels.json", JSON.stringify({}));
file = JSON.parse(fs.readFileSync("1s_labels.json", "utf8"));

const goodHeaders = {
    'Accept': '*/*',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'en-US;q=0.8,en;q=0.7',
    'Connection': 'keep-alive',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Host': 'www.1secmail.com',
    'Origin': 'https://www.1secmail.com',
    'Referer': 'https://www.1secmail.com/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:93.0) Gecko/20100101 Firefox/93.0'
};

/*
 Handles email generation. These emails do not expire, so we don't need to worry about refreshing them.
 */
const Email = {
    async readMessageById(data, id) {
        const { body } = await request(`https://www.1secmail.com/api/v1/?action=readMessage&login=${data.email.split('@')[0]}&domain=${data.email.split('@')[1]}&id=${id}`, {
            headers: {
                ...goodHeaders,
                'Cookie': `PHPSESSID=${data.sid}`
            }
        });
        const mail = await body.json();
        return mail;
    },

    async generate() {
        const forSid = await request('https://www.1secmail.com', {
            headers: goodHeaders
        });
        const sid = forSid.headers['set-cookie'].split(';')[0].split('=')[1];
        const { body } = await request('https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1', {
            headers: {
                ...goodHeaders,
                'Cookie': `PHPSESSID=${sid}`
            }
        });
        const email = (await body.json())[0];
        file[email] = {user: email.split('@')[0], domain: email.split('@')[1], mail: []};
        file[email].email = email;
        file[email].sid = sid;
        var mails = await Email.refresh(file[email]);
        file[email].mail = mails;
        file[email].host = 'https://www.1secmail.com';
        fs.writeFileSync("1s_labels.json", JSON.stringify(file));
        return file[email];
    },

    async refresh(data) {
        const { body } = await request(`https://www.1secmail.com/api/v1/?action=getMessages&login=${data.email.split('@')[0]}&domain=${data.email.split('@')[1]}`, {
            headers: {
                ...goodHeaders,
                'Cookie': `PHPSESSID=${data.sid}`
            },
            method: "GET"
        });
        const mails = await body.json();
        data.mail = mails;
        let o = [];
        for (var x of mails) {
            x.from = x.from.replace(/</g, '').replace(/>/g, '');
            x.to = "Me <" + data.email + ">";
            x.title = {
                preview: x.subject,
                full: x.subject
            };
            x.date = new Date(x.date).toLocaleTimeString();
            x.state = "new";
            x.subject = undefined;
            x = Object.fromEntries(Object.entries(x).filter(([_, v]) => v !== undefined));
            o.push(x);
        }
        return o;
    }
};

/*
 Handles cache.
 */
const Cache = {
    get(emailOrIndex) {
        let r;
        if (typeof emailOrIndex === 'number') {
            if (emailOrIndex < 0) {
                r = file[Object.keys(file)];
            }
        } else {
            r = file[emailOrIndex];
        }
        const e = Email.refresh(r);
        r.mail = e;
        return r;
    },

    all() {
        return file;
    },

    random() {
        return file[Object.keys(file)[Math.floor(Math.random() * Object.keys(file).length)]];
    },

    len() {
        return Object.keys(file).length;
    },

    save(email, data) {
        file[email] = data;
        fs.writeFileSync("1s_labels.json", JSON.stringify(file));
    },

    clear() {
        fs.writeFileSync("1s_labels.json", JSON.stringify({}));
        file = {};
    }
};

export { Email, Cache };
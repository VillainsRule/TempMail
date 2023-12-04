import { request } from 'undici';

let domains = [
    'mailto.plus',
    'fexpost.com',
    'fexbox.org',
    'mailbox.in.ua',
    'rover.info',
    'chitthi.in',
    'fextemp.com',
    'any.pink',
    'merepost.com'
];

function randomEmail() {
    return Math.random().toString(36).substring(2, 11) + '@' + domains[Math.floor(Math.random() * domains.length)];
}

function reparseMail(mail, email) {
    return mail.map(x => {
        let old = x;
        x = {};
        x.from = (old.from_name || old.from_mail.split('@')[0]) + ' <' + old.from_mail + '>';
        x.to = 'Me <' + email + '>';
        x.title = {
            preview: old.subject,
            full: old.subject
        };
        x.id = old.mail_id;
        x.state = old.is_new ? 'new' : 'read';
        x.date = old.time;
        return x;
    });
}

export async function getEmails(email) {
    let setEmail = email || randomEmail();
    
    const e = await (await request('https://tempmail.plus/api/mails?email=' + encodeURIComponent(setEmail) + '&epin=', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        },
    })).body.json();
    return {
        email: setEmail,
        mail: reparseMail(e.mail_list, setEmail)
    };
}

export async function refreshEmails(e) {
    const mail = await (await request('https://tempmail.plus/api/mails?email=' + encodeURIComponent(e.email) + '&epin=', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        },
    })).body.json();
    let rp = reparseMail(mail.mail_list, e.email);
    e.mail = rp;
    return e;
}

export async function getEmailContent(e, id) {
    const mail = await (await request('https://tempmail.plus/api/mails/' + id + '?email=' + encodeURIComponent(e.email) + '&epin=', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        },
    })).body.json();
    return mail.html || mail.text;
}
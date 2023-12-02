import Provider from './providers/10minutemail-one.js';
import SecMail from './providers/1secmail-com.js';
import MinuteInbox from './providers/minuteinbox-com.js';

let mail = new Provider();

mail.events.on('createEmail', async (email) => {
    console.log('Created email', email, '- fetching messages.');
    let m = await mail.getMessages();
    let mm = await mail.getMessages();
});

const secMail = await SecMail.Email.generate();
console.log(secMail);

const minuteInbox = await MinuteInbox.Email.generate();
console.log(minuteInbox);
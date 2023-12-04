import { getEmails, getEmailContent, refreshEmails } from "../providers/tempmail-plus.js";

const email = await getEmails("test@mailto.plus");
console.log(email);

const refresh = await refreshEmails(email);
console.log(refresh);

const content = await getEmailContent(email, email.mail[0].id);
console.log(content);
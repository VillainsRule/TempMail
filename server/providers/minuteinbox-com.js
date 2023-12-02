import { request } from "undici";
import fs from "fs";
import URL from "url";

let file;
if (!fs.existsSync("mi_labels.json"))
  fs.writeFileSync("mi_labels.json", JSON.stringify({}));
file = JSON.parse(fs.readFileSync("mi_labels.json", "utf8"));
let __cur_ind = 0;
let states = [];

const setIndex = (ind) => {
  __cur_ind = ind;
};
const getIndex = () => {
  return __cur_ind;
};
const setState = (key, value) => {
  if (states[__cur_ind] === undefined) {
    states[__cur_ind] = {};
  }
  states[__cur_ind][key] = value;
};
const getState = (key, index = __cur_ind) => {
  if (states[__cur_ind] === undefined) {
    return undefined;
  }
  return states[index][key];
};

/*
 a "proxied" call to request that includes an optional cookie and a random user agent
 */
const makeRequest = async (url, options = {}) => {
  const head = {
      ...options.headers,
      "Sec-Ch-Ua": '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"Windows"',
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      "Sec-Gpc": "1",
      "X-Requested-With": "XMLHttpRequest",
      "User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      "Referer": "https://" + (new URL.URL(url)).hostname,
      Cookie: (options.headers? (options.headers['cookie'] || options.headers['Cookie']) || (getState("cookie") ? "PHPSESSID=" + getState("cookie") + ";" : "") + (getState("host") === Host.MinuteInbox ? "MI=" + encodeURIComponent(getState("email")) + ";" : "TMA=" + encodeURIComponent(getState("email")) + ";") : undefined),
    };
  if (!head.Cookie) delete head.Cookie;
  return await request(url, {
    ...options,
    headers: head,
  });
};

/*
 formats a time string to minutemail's weird format.
 this onyl takes 10m, 1h, 1d, 1w, 1M as specified in spec.
 */
function fToM(f) {
  switch (f) {
    case "10m":
      return 4200;
    case "1h":
      return 3600;
    case "1d":
      return 86400;
    case "1w":
      return 604800;
    case "1M":
      return 568523;
    default:
      return 4200;
  }
}

const Host = {
  MinuteInbox: "https://www.minuteinbox.com",
  DisposableMail: "https://www.disposablemail.com",
};

let defaults = {};

const Config = {
  set(key, value) {
    defaults[key] = value;
  },
  get(key) {
    return defaults[key];
  },
};

const Replacers = {
    parseFromOrTo: (fromOrTo) => {
        const email = fromOrTo.split('<')[1].split('>')[0];
        const name = fromOrTo.split('<')[0].trim();
        if (email === "Admin@DisposableMail.com" || email === "Admin@MinuteInbox.com") {
            return "Admin <Admin@tempmail.villainsrule.xyz>";
        }
    },
    spoofMessageTitle: (message) => {
        if (message.title.preview === "Welcome to DisposableMail..." || message.title.full === "Welcome to DisposableMail:)" || message.title.preview === "Welcome to MinuteInbox:)" || message.title.full === "Welcome to MinuteInbox..." || message.title.full === "Welcome to MinuteInbox:)") {
            return "Welcome to TempMail.";
        } else {
            return message.title.preview;
        }
    }
};

function makeUnderstandable(email, mails) {
  let m = mails;
  let f = [];
  for (let i = 0; i < m.length; i++) {
    let orig = m[i];
    let built = {};
    built.title = {
      preview: orig.predmetZkraceny,
      full: orig.predmet
    };
    built.from = orig.od;
    built.to = "Me <" + email + ">";
    built.date = orig.kdy;
    built.state = orig.precteno;
    built.id = orig.id;
    built.from = Replacers.parseFromOrTo(built.from);
    built.to = Replacers.parseFromOrTo(built.to);
    built.title.preview = Replacers.spoofMessageTitle(built);
    built.title.full = Replacers.spoofMessageTitle(built);
    f.push(built);
  }
  return f;
}

console.miHook = {
  log: (...args) => {
    if (Config.get("log")) {
      console.log(...args);
    }
  }
};

const Email = {
  async getEmailContent(data, id) {
    const d = await makeRequest(
        data.host + "/email/id/" + id,
        {
          method: "GET",
          headers: {
            cookie: data.cookie,
          },
        }
    );
    const dTxt = (await d.body.text()).replace(/[^\S ]+/g, "");
    return dTxt;
  },

  async expiryStatus(data) {
    const expiry = await this.expiry(data);
    if (expiry.timeLeft <= 0) {
      return {
        ...expiry,
        expired: true,
      };
    }
    return {
      ...expiry,
      expired: false
    };
  },
  /*
 generates a new email and returns the emails and cookie, caching the email, cookie and expiry for later use
 */
  async generate(host = Host.MinuteInbox) {
    setIndex(getIndex() + 1);
    const sessId = await makeRequest(host + '/');
    let cached_r;
    let id = (sessId.headers["set-cookie"] || sessId.headers["Set-Cookie"])
      .split(";")
      .find((x) => x.split("=")[0] === "PHPSESSID");
    let mi1 = (sessId.headers["set-cookie"] || sessId.headers["Set-Cookie"])
      .split(";")
      .find((x) => x.split("=")[0] === "MI" || x.split("=")[0] === "TMA");
    if (mi1) mi1 = mi1.split("=")[1];
    if (id) id = id.split("=")[1];
    else {
      console.miHook.log("No PHPSESSID found in cookie. Attempting to regenerate!")
      cached_r = await makeRequest(host + "/index/refresh", {
        headers: {
          "Cookie": (host === Host.MinuteInbox ? "MI=" : "TMA=") + encodeURIComponent(mi1.split('=')[1]) + ";",
        },
      });
      id = (cached_r.headers["set-cookie"] || cached_r.headers["Set-Cookie"])
        .split(";")
        .find((x) => x.split("=")[0] === "PHPSESSID");
      if (id) {
        console.miHook.log("Regenerated PHPSESSID: " + id);
        id = id.split("=")[1];
      }
      else throw new Error("No PHPSESSID found in cookie and it cannot regenerate!");
    }
    setState("cookie", id);
    setState("host", host);


    const emailId = await makeRequest(
      host + "/index/index",
      {
        headers: {
          Referer: host,
        },
        body: null,
        method: "GET",
      }
    );
    const special_test = await emailId.body.text();
    const emailIdJson = JSON.parse(special_test.replace(/\s/g, ""));
    let email = mi1 ? decodeURIComponent(mi1) : emailIdJson.email;
    let mi = mi1 || encodeURIComponent(email);
    let checkedFC = emailId.headers["set-cookie"] || emailId.headers["Set-Cookie"];
    if (checkedFC) {
      if (!id) {
        id = checkedFC.split(";").find((x) => x.split("=")[0] === "PHPSESSID");
        console.miHook.log("sid from index: " + id);
        if (id) id = id.split("=")[1];
      }
      let t_mi = checkedFC.split(";").find((x) => x.split("=")[0] === "MI" || x.split("=")[0] === "TMA");
      if (t_mi && t_mi !== "MI=undefined" && t_mi !== "TMA=undefined") {
        mi = t_mi.split("=")[1];
        console.miHook.log("MI: " + mi);
      }
    }
    let fullCookie = "PHPSESSID=" + id + ";";
    if (host === Host.MinuteInbox) {
      fullCookie += "MI=" + mi + ";";
    } else if (host === Host.DisposableMail) {
      fullCookie += "TMA=" + mi + ";";
    }
    setState("email", email);

    const getEmails = async () => {
      const emails = await makeRequest(
        host + "/index/refresh",
        {
          method: "GET",
          headers: {
            cookie: fullCookie,
          },
        }
      );
      const emailsJson = await emails.body.text();
      if (emailsJson.length === 0) {
        throw new Error("You may have been rate limited. Try again in a few minutes.")
      }
      return makeUnderstandable(email.trim(), JSON.parse(emailsJson.replace(/[^\S ]+/g, "")));
    };
    email = email.trim();

    const expiry = await Email.expiryStatus({
      email,
      cookie: fullCookie,
      host,
    });
    file[email] = {
      email: email,
      cookie: fullCookie,
      expiry: expiry.expiry,
      timeLeft: expiry.timeLeft,
      host: host,
    };
    fs.writeFileSync("mi_labels.json", JSON.stringify(file));
    return {
      mail: await getEmails(),
      email: email,
      cookie: fullCookie,
      expiry: expiry.expiry,
      timeLeft: expiry.timeLeft,
      host: host,
    };
  },

  /*
 refreshes the emails of a given cookie. how refreshing!
 */
  emails(data) {
    return new Promise(async (resolve, reject) => {
      const emails = await makeRequest(
        data.host + "/index/refresh",
        {
          method: "GET",
          headers: {
            cookie: data.cookie
          },
        }
      );
      const emailsJson = await emails.body.text();
      resolve(makeUnderstandable(data.email, JSON.parse(emailsJson.replace(/[^\S ]+/g, ""))));
    });
  },

  /*
 mainly for internal use, but can be used to get the expiry of an email
 */
  async expiry(data) {
    if (!data.cookie) {
      throw new Error("No cookie provided");
    }
    const expiry = await makeRequest(
      data.host + "/index/zivot",
      {
        method: "GET",
        headers: {
          cookie: data.cookie.split(';')[1] + ';' + data.cookie.split(';')[0]
        },
      }
    );
    let expiryJson = JSON.parse(
      (await expiry.body.text()).replace(/[^\S ]+/g, "")
    );
    const key = expiryJson.konec;
    const max = new Date(key.replace(" ", "T") + "Z");
    const tl =
      max.getTime() -
      new Date(expiryJson.konec.replace(" ", "T") + "Z").getTime();
    for (const email in file) {
      if (file[email].cookie === data.cookie) {
        file[email].expiry = expiryJson.konec.replace(" ", "T") + "Z";
        break;
      }
    }
    fs.writeFileSync("mi_labels.json", JSON.stringify(file));
    data.expiry = max.toISOString();
    data.timeLeft = tl;
    return data;
  },

  /*
  extends the expiry of an email by a given time.
  this only takes 10m, 1h, 1d, 1w, 1M as specified in spec.
 this assigns the new email to your data object as specified, but it also returns the new data object.
 */
  async extend(time, data) {
    if (typeof time === "string") {
      time = fToM(time);
    }
    const extended = await makeRequest(
      data.host + "/expirace/" + time,
      {
        method: "GET",
        headers: {
          cookie: data.cookie,
        },
      }
    );
    let ex = await this.expiry(data);
    data.expiry = ex.expiry;
    data.timeLeft = ex.timeLeft;
    file[data.email].expiry = data.expiry;
    file[data.email].timeLeft = data.timeLeft;
    return data;
  },

  /*
 edits the email of a given cookie.
 this assigns the new email to your data object as specified, but it also returns the new data object.
 */
  async edit(email, data) {
    const emails = await makeRequest(
      data.host + "/index/new-email/",
      {
        method: "POST",
        headers: {
          accept: "application/json, text/javascript, */*; q=0.01",
          "accept-language": "en-US,en;q=0.9,ca;q=0.8",
          "sec-ch-ua":
            '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "sec-gpc": "1",
          "x-requested-with": "XMLHttpRequest",
          cookie: data.cookie,
          Referer: "https://www.minuteinbox.com/",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        body: "emailInput=" + encodeURIComponent(email) + "&format=json",
      }
    );
    let thisData = data;
    thisData.email = email;
    thisData.cookie = data.cookie
      .split(";")
      .map((x) =>
        x.split("=")[0] === "MI" ? "MI=" + encodeURIComponent(email) : x.split("=")[0] === "TMA" ? "TMA=" + encodeURIComponent(email) : x
      )
      .join(";");
    data = thisData;
    return thisData;
  },
};

/**
 * State management for the client. This exposes what emails and cookies were generated in the current runtime.
 */
const State = {
  Index: {
    set: setIndex,
    get: getIndex,
  },
  State: {
    set: setState,
    get: getState,
  },
};

/**
 * @description Cache management for the client. This exposes the ability to save and load emails and cookies to a file, and shows the history of all generated emails.
 */
const Cache = {
  async cacheCheck() {
    const keys = Object.keys(file);
    for (let i = 0; i < keys.length; i++) {
      const email = keys[i];
      const emailObj = file[email];
      const approximatedExpiry = new Date(emailObj.expiry);
      approximatedExpiry.setSeconds(approximatedExpiry.getSeconds() + 1);
      if (approximatedExpiry.getTime() < new Date().getTime()) {
        delete file[email];
      } else {
        const expiry = await Email.expiryStatus(emailObj);
        if (expiry.timeLeft <= 0) {
          delete file[email];
        }
      }
    }
    fs.writeFileSync("mi_labels.json", JSON.stringify(file));
  },

  async refresh(indexOrEmail) {
    if (typeof indexOrEmail === "number") {
      const keys = Object.keys(file);
      if (indexOrEmail < 0) {
        indexOrEmail = keys.length + indexOrEmail;
      }
      return {
        mail: await (file[keys[indexOrEmail]]),
        email: file[keys[indexOrEmail]].email,
        cookie: file[keys[indexOrEmail]].cookie,
        expiry: file[keys[indexOrEmail]].expiry,
        timeLeft: file[keys[indexOrEmail]].timeLeft,
      };
    } else {
      return {
        mail: await Email.emails(file[indexOrEmail]),
        email: file[indexOrEmail].email,
        cookie: file[indexOrEmail].cookie,
        expiry: file[indexOrEmail].expiry,
        timeLeft: file[indexOrEmail].timeLeft,
      };
    }
  },

  last() {
    const keys = Object.keys(file);
    return file[keys[keys.length - 1]];
  },

  len() {
    return Object.keys(file).length;
  },

  random() {
    const keys = Object.keys(file);
    return file[keys[Math.floor(Math.random() * keys.length)]];
  },

  get(email) {
    return file[email];
  },

  save(info) {
    file[info.email] = {
      cookie: info.cookie,
      email: info.email,
      expiry: info.expiry,
      timeLeft: info.timeLeft,
      host: info.host,
    };
    fs.writeFileSync("mi_labels.json", JSON.stringify(file));
  },

  all() {
    return file;
  },

  clear(saveProps = {}) {
    if (Object.keys(saveProps).length == 0) {
      file = {};
    } else {
      const keys = Object.keys(file);
      const newFile = {};
      for (let i = 0; i < keys.length; i++) {
        const email = keys[i];
        const emailObj = file[email];
        const newEmailObj = {};
        for (const prop in saveProps) {
          if (emailObj.hasOwnProperty(prop)) {
            newEmailObj[prop] = emailObj[prop];
          }
        }
        newFile[email] = newEmailObj;
      }
      file = newFile;
    }
    fs.writeFileSync("mi_labels.json", JSON.stringify(file));
  },
};

export { Email, State, Cache, Host, Config };
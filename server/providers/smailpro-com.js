import { request } from "undici";
import ua from "random-useragent";

let p = {};

export async function getEmail() {
    let key = await (
        await request("https://smailpro.com/app/key", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "User-Agent": ua.getRandom(),
            },
            body: JSON.stringify({ domain: "random", username: "random" }),
        })
    ).body.json();
    if (key.code !== 200) {
        throw new Error("Failed to get key: " + key.msg);
    }
    key = key.items;
    const email = await (await request("https://api.sonjj.com/email/gd/get?key=" + key + "&rapidapi-key=f871a22852mshc3ccc49e34af1e8p126682jsn734696f1f081&domain=random&username=random", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "User-Agent": ua.getRandom(),
        },
    })).body.json();
    if (email.code !== 200) {
        throw new Error("Failed to get email: " + email.msg);
    }
    p[email.items.email] = key;
    return {
        email: email.items.email,
        timestamp: email.items.timestamp,
        key: key
    };
};

setInterval(async () => {
    for (var x of Object.keys(p)) {
        let key = await (
            await request("https://smailpro.com/app/key", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "User-Agent": ua.getRandom(),
                },
                body: JSON.stringify({ domain: x.split("@")[1], username: x.split("@")[0] }),
            })
        ).body.json();
        if (key.code !== 200) {
            throw new Error("Failed to get key: " + key.msg);
        }
        key = key.items;
        p[x] = key;
    }
}, 20000);

export async function update(data) {
    data.key = p[data.email];
    return data;
}

export async function getInbox(data) {
    const inbox = await (await request("https://api.sonjj.com/email/gd/check?key=" + data.key + "&rapidapi-key=f871a22852mshc3ccc49e34af1e8p126682jsn734696f1f081&email=" + data.email + "&timestamp=" + data.timestamp, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "User-Agent": ua.getRandom(),
        },
    })).body.json();
    if (inbox.code !== 200) {
        throw new Error("Failed to get inbox: " + inbox.msg);
    }
    return inbox.items;
}
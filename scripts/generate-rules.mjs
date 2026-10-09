import { readFileSync, writeFileSync } from "node:fs";
const stations = JSON.parse(
  readFileSync(
    new URL("../src/interaction-data.json", import.meta.url),
    "utf8",
  ),
);
const moderation = JSON.parse(
  readFileSync(new URL("../src/moderation-data.json", import.meta.url), "utf8"),
);
const separator = "";
const strip = [
  ..." \n\r\t0123456789._~!@#$%^&*()+,?-/\\:;[]{}'\"`",
  "\u200b",
  "\u200c",
  "\u200d",
  "\ufeff",
];
const cleanText = strip.reduce(
  (expression, char) => `${expression}.replace(${JSON.stringify(char)}, '')`,
  "newData.val()",
);
const letters = (word) =>
  [...word]
    .map((c) =>
      /[a-z]/i.test(c)
        ? `[${c.toLowerCase()}${String.fromCharCode(c.toUpperCase().charCodeAt(0) + 0xfee0)}${String.fromCharCode(c.toLowerCase().charCodeAt(0) + 0xfee0)}]`
        : c,
    )
    .join(separator);
const badPattern = [...moderation.terms, "ㅅㅣㅂㅏㄹ", "ㅆㅣㅂㅏㄹ"]
  .flatMap((w) => [letters(w), letters(w.normalize("NFKC"))])
  .join("|");
const sibal = `시${separator}발`;
writeFileSync(
  new URL("../src/moderation-pattern.json", import.meta.url),
  JSON.stringify({
    pattern: `${badPattern}|${sibal}[^점역]|${sibal}$`,
    strip,
  }) + "\n",
);
const mapIds = ["park", "rooftop", "office", "cafe", "beach", "campus"];
const roster = (room, slot) =>
  `root.child('roster').child(${room}).child(${slot})`;
const own = (room, slot) =>
  `(${roster(room, slot)}.child('uid').val() == auth.uid && ${roster(room, slot)}.child('live').hasChild(${roster(room, slot)}.child('session').val()))`;
const member = (room) =>
  `auth != null && (${Array.from({ length: 8 }, (_, i) => own(room, `'${i}'`)).join(" || ")})`;
const mapValid = `$room.matches(/^(park|rooftop|office|cafe|beach|campus)$/)`;
const slotValid = `$slot.matches(/^[0-7]$/)`;
const nickname = {
  ".validate":
    "newData.isString() && newData.val().matches(/^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9]{2,12}$/)",
};
const num = (min, max) => ({
  ".validate": `newData.isNumber() && newData.val() >= ${min} && newData.val() <= ${max}`,
});
const profile = {
  ".validate":
    "newData.hasChildren(['nickname','hair','shirt','pants','hairstyle','accessory'])",
  nickname,
  hair: num(0, 7),
  shirt: num(0, 7),
  pants: num(0, 7),
  skin: num(0, 4),
  accessoryColor: num(0, 7),
  face: {
    ".validate": "newData.val().matches(/^(friendly|smile|sleepy|wink|bold)$/)",
  },
  hairstyle: {
    ".validate":
      "newData.val() == 'short' || newData.val() == 'bob' || newData.val() == 'spiky' || newData.val() == 'long'",
  },
  accessory: {
    ".validate":
      "newData.val().matches(/^(none|cap|glasses|headphones|ribbon|backpack|crown)$/)",
  },
  $other: { ".validate": false },
};
for (const key of ["hair", "shirt", "pants", "skin", "accessoryColor"])
  profile[key][".validate"] += " && newData.val() % 1 == 0";
const uniqueness = mapIds
  .flatMap((m) =>
    Array.from(
      { length: 8 },
      (_, s) =>
        `(!${roster(`'${m}'`, `'${s}'`)}.child('live').exists() || ${roster(`'${m}'`, `'${s}'`)}.child('uid').val() != auth.uid)`,
    ),
  )
  .join(" && ");
const playerRef = `root.child('roster').child($room).child($slot)`;
const rosterSlot = {
  ".write": `auth != null && ${mapValid} && ${slotValid} && (!data.child('live').exists() || data.child('uid').val() == auth.uid)`,
  ".validate": `newData.hasChildren(['uid','session','joinedAt']) && (newData.child('uid').val() == auth.uid || newData.child('uid').val() == data.child('uid').val()) && (!newData.child('live').exists() || (newData.child('live').hasChild(newData.child('session').val()))) && (data.child('live').exists() || !newData.child('live').exists() || (${uniqueness}))`,
  uid: {
    ".validate":
      "newData.isString() && (newData.val() == auth.uid || newData.val() == data.val())",
  },
  session: { ".validate": "newData.isString() && newData.val().length <= 50" },
  joinedAt: num(0, 9999999999999),
  live: {
    $session: {
      ".write": `auth != null && ((!data.exists() && !newData.exists()) || ${playerRef}.child('uid').val() == auth.uid)`,
      ".validate": `newData.val() == true && $session == newData.parent().parent().child('session').val()`,
    },
  },
  $other: { ".validate": false },
};
const slotPlayer = {
  ".write": `auth != null && ${mapValid} && ${slotValid} && ((!data.exists() && !newData.exists()) || (!newData.exists() && data.child('uid').val() == auth.uid) || (${own("$room", "$slot")} && ${playerRef}.child('session').val() == newData.child('session').val()))`,
  ".validate":
    "newData.hasChildren(['uid','session','slot','profile','x','z','rotation','at','emote'])",
  uid: { ".validate": "newData.val() == auth.uid" },
  session: {
    ".validate": `newData.val() == ${playerRef}.child('session').val()`,
  },
  slot: {
    ".validate":
      "newData.isNumber() && newData.val() >= 0 && newData.val() <= 7 && newData.val() + '' == $slot",
  },
  profile,
  x: num(-6.7, 6.7),
  z: num(-6.7, 6.7),
  rotation: num(-3.15, 3.15),
  at: { ".validate": "newData.isNumber() && newData.val() <= now + 5000" },
  emote: {
    ".validate":
      "newData.hasChildren(['kind','at']) && (newData.child('at').val() == data.child('at').val() || !data.exists() || newData.child('at').val() >= data.child('at').val() + 3300)",
    kind: {
      ".validate":
        "newData.val().matches(/^(none|wave|surprise|joy|dance|clap|love)$/)",
    },
    at: { ".validate": "newData.isNumber() && newData.val() <= now + 5000" },
    $other: { ".validate": false },
  },
  activity: {
    ".validate": `newData.hasChildren(['id','kind','at']) && (${stations.map((s) => `($room == '${s.map}' && newData.child('id').val() == '${s.id}' && newData.child('kind').val() == '${s.kind}' && (newData.parent().child('x').val()-(${s.x}))*(newData.parent().child('x').val()-(${s.x}))+(newData.parent().child('z').val()-(${s.z}))*(newData.parent().child('z').val()-(${s.z})) <= 4.6225)`).join(" || ")})`,
    id: { ".validate": "newData.isString()" },
    kind: { ".validate": "newData.isString()" },
    at: { ".validate": "newData.isNumber() && newData.val() <= now + 5000" },
    $other: { ".validate": false },
  },
  $other: { ".validate": false },
};
const chatSlot = {
  ".write": `auth != null && ${mapValid} && ${slotValid} && ${own("$room", "$slot")}`,
  ".validate": "true",
  $ring: {
    ".write": `!newData.exists() && ${member("$room")} && (data.child('at').val() <= now - 600000 || data.child('session').val() != ${roster("$room", "$slot")}.child('session').val() || !${roster("$room", "$slot")}.child('live').hasChild(data.child('session').val()))`,
    ".validate":
      "$ring.matches(/^(0|[1-9]|1[0-9])$/) && newData.hasChildren(['uid','session','nickname','text','at']) && newData.child('uid').val() == auth.uid",
    uid: { ".validate": "newData.val() == auth.uid" },
    session: {
      ".validate": `newData.val() == ${playerRef}.child('session').val()`,
    },
    nickname,
    text: {
      ".validate":
        "newData.isString() && newData.val().length > 0 && newData.val().length <= 200",
    },
    at: {
      ".validate":
        "newData.isNumber() && newData.val() >= now - 5000 && newData.val() <= now + 5000",
    },
    $other: { ".validate": false },
  },
};
// Root game transactions require subtree validators, including explicit retention of existing stones.
const sameId = "newData.child('id').val() == data.child('id').val()";
const participant =
  "(auth.uid == data.child('host').val() || auth.uid == data.child('guest').val())";
const validParticipant = (who) =>
  `${roster("$room", `newData.child('${who}Slot').val() + ''`)}.child('uid').val() == newData.child('${who}').val() && ${roster("$room", `newData.child('${who}Slot').val() + ''`)}.child('live').hasChild(newData.child('${who}Session').val())`;
const noOtherGames = Array.from(
  { length: 4 },
  (_, i) =>
    `($game == '${i}' || !root.child('rooms').child($room).child('games/${i}').exists() || root.child('rooms').child($room).child('games/${i}/deadline').val() <= now || !root.child('rooms').child($room).child('games/${i}/status').val().matches(/^(invited|active)$/) || ((root.child('rooms').child($room).child('games/${i}/host').val() != newData.child('host').val() && root.child('rooms').child($room).child('games/${i}/guest').val() != newData.child('host').val()) && (root.child('rooms').child($room).child('games/${i}/host').val() != newData.child('guest').val() && root.child('rooms').child($room).child('games/${i}/guest').val() != newData.child('guest').val())))`,
).join(" && ");
const inactive =
  "(!data.exists() || data.child('deadline').val() <= now || data.child('status').val() == 'finished' || data.child('status').val() == 'aborted' || data.child('status').val() == 'declined' || data.child('status').val() == 'cancelled' || !root.child('roster').child($room).child(data.child('hostSlot').val() + '').child('live').hasChild(data.child('hostSession').val()) || !root.child('roster').child($room).child(data.child('guestSlot').val() + '').child('live').hasChild(data.child('guestSession').val()))";
const init = `${inactive} && newData.child('host').val() == auth.uid && newData.child('host').val() != newData.child('guest').val() && ${validParticipant("host")} && ${validParticipant("guest")} && ${noOtherGames} && newData.child('status').val() == 'invited' && newData.child('next').val() == 0 && !newData.child('board').exists() && !newData.child('commits').exists() && !newData.child('reveals').exists() && newData.child('createdAt').val() >= now - 5000 && newData.child('deadline').val() <= now + 35000 && newData.child('deadline').val() > now`;
const immutable = [
  "id",
  "slot",
  "type",
  "host",
  "guest",
  "hostSlot",
  "guestSlot",
  "hostSession",
  "guestSession",
  "createdAt",
]
  .map((k) => `newData.child('${k}').val() == data.child('${k}').val()`)
  .join(" && ");
const retain = Array.from(
  { length: 225 },
  (_, i) =>
    `(!data.child('board/${i}').exists() || newData.child('board/${i}').exists())`,
).join(" && ");
const keepProof = ["commits", "reveals"]
  .flatMap((path) =>
    ["host", "guest"].map(
      (w) =>
        `(!data.child('${path}').child(data.child('${w}').val()).exists() || newData.child('${path}').child(data.child('${w}').val()).exists())`,
    ),
  )
  .join(" && ");
const stateChange = `(newData.child('status').val() == data.child('status').val() || (data.child('status').val() == 'invited' && ((newData.child('status').val() == 'active' && auth.uid == data.child('guest').val() && data.child('deadline').val() > now) || (newData.child('status').val() == 'declined' && auth.uid == data.child('guest').val()) || (newData.child('status').val() == 'cancelled' && auth.uid == data.child('host').val()))) || (data.child('status').val() == 'active' && (newData.child('status').val() == 'aborted' || (newData.child('status').val() == 'finished' && ((data.child('type').val() == 'rps' && newData.child('reveals').hasChildren([data.child('host').val(), data.child('guest').val()])) || (data.child('type').val() == 'gomoku' && newData.child('next').val() >= 9))))) )`;
const boardCount =
  "(" +
  Array.from(
    { length: 225 },
    (_, i) => `(newData.child('board/${i}').exists() ? 1 : 0)`,
  ).join(" + ") +
  ")";
const game = {
  ".write": `auth != null && ${mapValid} && $game.matches(/^[0-3]$/) && newData.exists() && (${member("$room")}) && ((${sameId} && ${participant}) || (!(${sameId}) && newData.child('host').val() == auth.uid))`,
  ".validate": `newData.hasChildren(['id','slot','type','host','guest','hostSlot','guestSlot','hostSession','guestSession','status','createdAt','deadline','next']) && ((!(${sameId}) && (${init})) || (${sameId} && ${immutable} && ${stateChange} && ${retain} && ${keepProof} && newData.child('next').val() == ${boardCount} && (newData.child('next').val() == data.child('next').val() || (data.child('status').val() == 'active' && data.child('deadline').val() > now && newData.child('next').val() == data.child('next').val() + 1)) && newData.child('deadline').val() <= now + 305000))`,
  id: { ".validate": "newData.isString() && newData.val().length <= 50" },
  slot: { ".validate": "newData.isNumber() && newData.val() + '' == $game" },
  type: { ".validate": "newData.val() == 'rps' || newData.val() == 'gomoku'" },
  host: { ".validate": "newData.isString()" },
  guest: { ".validate": "newData.isString()" },
  hostSlot: num(0, 7),
  guestSlot: num(0, 7),
  hostSession: {
    ".validate": "newData.isString() && newData.val().length <= 50",
  },
  guestSession: {
    ".validate": "newData.isString() && newData.val().length <= 50",
  },
  createdAt: num(0, 9999999999999),
  deadline: num(0, 9999999999999),
  next: num(0, 225),
  status: {
    ".validate":
      "newData.val().matches(/^(invited|active|declined|cancelled|finished|aborted)$/)",
  },
  board: {
    $cell: {
      ".validate":
        "$cell.matches(/^(0|[1-9]|[1-9][0-9]|1[0-9]{2}|2[01][0-9]|22[0-4])$/) && newData.hasChildren(['uid','n']) && ((data.exists() && newData.child('uid').val() == data.child('uid').val() && newData.child('n').val() == data.child('n').val()) || (!data.exists() && data.parent().parent().child('status').val() == 'active' && data.parent().parent().child('type').val() == 'gomoku' && newData.child('uid').val() == auth.uid && newData.child('n').val() == data.parent().parent().child('next').val() && ((data.parent().parent().child('next').val() % 2 == 0 && auth.uid == data.parent().parent().child('host').val()) || (data.parent().parent().child('next').val() % 2 == 1 && auth.uid == data.parent().parent().child('guest').val()))))",
      uid: { ".validate": "newData.isString()" },
      n: num(0, 224),
      $other: { ".validate": false },
    },
  },
  commits: {
    $uid: {
      ".validate":
        "newData.isString() && newData.val().matches(/^[a-f0-9]{64}$/) && ((data.exists() && newData.val() == data.val()) || (!data.exists() && $uid == auth.uid && data.parent().parent().child('status').val() == 'active' && data.parent().parent().child('type').val() == 'rps' && data.parent().parent().child('deadline').val() > now))",
    },
  },
  reveals: {
    $uid: {
      ".validate":
        "newData.hasChildren(['choice','salt']) && ((data.exists() && newData.child('choice').val() == data.child('choice').val() && newData.child('salt').val() == data.child('salt').val()) || (!data.exists() && $uid == auth.uid && data.parent().parent().child('commits').hasChildren([data.parent().parent().child('host').val(), data.parent().parent().child('guest').val()]) && data.parent().parent().child('status').val() == 'active' && data.parent().parent().child('deadline').val() > now))",
      choice: {
        ".validate":
          "newData.val() == 'rock' || newData.val() == 'paper' || newData.val() == 'scissors'",
      },
      salt: {
        ".validate":
          "newData.isString() && newData.val().matches(/^[a-f0-9]{64}$/)",
      },
      $other: { ".validate": false },
    },
  },
  $other: { ".validate": false },
};
// Only accepting an invitation or placing one stone may restart a clock.
const clock = `(data.child('status').val() == 'invited' && newData.child('status').val() == 'active' ? (newData.child('deadline').val() > now && newData.child('deadline').val() <= now + (data.child('type').val() == 'gomoku' ? 10500 : 45500)) : (newData.child('next').val() == data.child('next').val() ? newData.child('deadline').val() == data.child('deadline').val() : (data.child('type').val() == 'gomoku' && newData.child('deadline').val() >= now + 8500 && newData.child('deadline').val() <= now + 10500)))`;
game[".validate"] += ` && (!(${sameId}) || ${clock})`;
const rules = {
  ".read": false,
  ".write": false,
  roster: {
    ".read": "auth != null",
    $room: { ".validate": mapValid, $slot: rosterSlot },
  },
  rooms: {
    $room: {
      players: { ".read": member("$room"), $slot: slotPlayer },
      chat: { ".read": member("$room"), $slot: chatSlot },
      games: { ".read": member("$room"), $game: game },
    },
  },
};
const chatDelay = Array.from(
  { length: 20 },
  (_, i) =>
    `(!data.parent().child('${i}/at').exists() || newData.child('at').val() >= data.parent().child('${i}/at').val() + 1000)`,
).join(" && ");
chatSlot.$ring.text[".validate"] =
  `newData.isString() && newData.val().length > 0 && newData.val().length <= 200 && !${cleanText}.matches(/${badPattern}/i) && !${cleanText}.matches(/${sibal}[^점역]/i) && !${cleanText}.matches(/${sibal}$/i)`;
chatSlot["$ring"][".validate"] +=
  ` && ((data.exists() && newData.child('at').val() == data.child('at').val() && newData.child('text').val() == data.child('text').val() && newData.child('uid').val() == data.child('uid').val()) || (${chatDelay}))`;
writeFileSync(
  new URL("../database.rules.json", import.meta.url),
  JSON.stringify({ rules }, null, 2) + "\n",
);

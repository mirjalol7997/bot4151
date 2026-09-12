/* ==========================================================================
   Боты группы 4151 (Экономика)
   @Ekonomik4151bot — основной   |   @Ekonomik4151_support_bot — поддержка
   Cloudflare Worker, один код на оба бота
   --------------------------------------------------------------------------
   ПЕРЕМЕННЫЕ (Settings → Variables and Secrets)
     BOT_TOKEN        Secret  — токен основного бота
     SUPPORT_TOKEN    Secret  — токен бота поддержки
     WEBHOOK_SECRET   Secret  — длинная случайная строка без пробелов
     ADMIN_IDS        Text    — ваш Telegram id (можно несколько через запятую)
   ХРАНИЛИЩЕ (Settings → Bindings → KV namespace)
     Variable name: KV
   CRON (Settings → Trigger Events → Cron Trigger)
     каждые 5 минут
   ЗАПУСК
     открыть https://ВАШ-WORKER.workers.dev/setup?key=WEBHOOK_SECRET
   ========================================================================== */

const SITE = "https://edubiotech.me";
const MAIN_BOT = "Ekonomik4151bot";
const SUPPORT_BOT = "Ekonomik4151_support_bot";
const TZ = 7 * 60;                 // Новосибирск, UTC+7
const MORNING = 7 * 60 + 30;       // 07:30
const EVENING = 21 * 60;           // 21:00
const ENG_PING = 18 * 60 + 45;     // вторник 18:45

/* ========================= РАСПИСАНИЕ ========================= */
const PAIRS = {1:["09:00","10:30"],2:["10:40","12:10"],3:["12:50","14:20"],
               4:["14:30","16:00"],5:["16:10","17:40"],6:["17:45","19:15"],7:["19:20","20:50"]};
const DAYS = ["","Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"];
const DSH  = ["","Пн","Вт","Ср","Чт","Пт","Сб"];
const BUILDINGS = {
  "Д":{n:"Главный корпус",a:"ул. Добролюбова, 160"},
  "З":{n:"Институт экологической и пищевой биотехнологии",a:"ул. Добролюбова, 162"},
  "Н":{n:"Инженерный институт",a:"ул. Никитина, 147"},
  "НК":{n:"Новый корпус",a:"ул. Никитина, 155"},
  "СПЗ":{n:"Спортивный комплекс",a:"ул. Никитина, 151"},
  "А":{n:"Аудиторный блок",a:"ул. Никитина, 155б"}
};
const SEMESTER = {from:"2026-09-01", to:"2027-01-16"};
const ANCHOR = "2026-08-31";

const SUBJECTS = {
  inyaz:{name:"Иностранный язык",teacher:"Филипьева Елена Викторовна",
    terms:[{t:"пр",from:"2026-09-07",to:"2026-11-21"}],
    note:"Занятия дистанционные, по вторникам в 19:00. Ссылку преподаватель присылает перед парой."},
  orgos:{name:"Основы российской государственности",teacher:"Рехтина Г.А",
    terms:[{t:"л",from:"2026-11-09",to:"2027-01-16"},{t:"пр",from:"2026-11-16",to:"2027-01-20"}]},
  osu:{name:"Основы социального управления",teacher:"Антошкина О.Г",
    terms:[{t:"л",from:"2026-11-09",to:"2026-12-12"},{t:"пр",from:"2026-11-16",to:"2026-12-26"}]},
  matan:{name:"Математический анализ",teacher:"Журавская С.А",
    terms:[{t:"л",from:"2026-11-09",to:"2026-12-12"},{t:"пр",from:"2026-11-16",to:"2026-12-26"}]},
  linal:{name:"Линейная алгебра",teacher:"Фомина Т.В",
    terms:[{t:"л",from:"2026-09-01",to:"2026-10-24"},{t:"пр",from:"2026-09-07",to:"2026-10-31"}]},
  menedj:{name:"Основы менеджмента",teacher:"Завальнюк Е.Ю · Никитина Т.В",
    terms:[{t:"л",from:"2026-11-02",to:"2026-12-19"},{t:"пр",from:"2026-11-09",to:"2026-12-26"}]},
  office:{name:"Офисные приложения и технологии",teacher:"не указан в расписании",
    terms:[{t:"л",from:"2026-09-01",to:"2026-10-26"},{t:"пр",from:"2026-09-07",to:"2026-11-28"}]},
  micro:{name:"Микроэкономика",teacher:"Шаравина Е.В",
    terms:[{t:"л",from:"2026-09-01",to:"2026-11-07"},{t:"пр",from:"2026-09-07",to:"2026-11-21"}]},
  fizra:{name:"Физическая культура и спорт",teacher:"не указан в расписании",
    terms:[{t:"пр",from:"2026-09-07",to:"2026-12-05"}],
    note:"В сетке стоит только организационное занятие 05.09 в НК-424."}
};

const L = [];
const add = (s,t,w,d,ps,room,g="51") => ps.forEach(p => L.push({s,t,w,d,p,room,g}));
add("inyaz","пр","н",2,[6,7],"НК-336","51А");
add("inyaz","пр","н",6,[6,7],"НК-336","51Б");
add("inyaz","пр","ч",2,[6,7],"НК-336","51Б");
add("inyaz","пр","ч",6,[6,7],"НК-336","51А");
add("orgos","л","ч",3,[7],"А-3");
add("orgos","пр","н",6,[1,2],"НК-534");
add("osu","л","ч",4,[6,7],"НК-538");
add("osu","пр","ч",6,[2,3],"НК-538");
add("matan","л","н",4,[6,7],"Н-315");
add("matan","пр","н",6,[3],"Н-303");
add("matan","пр","ч",6,[4],"Н-303");
add("linal","л","н",6,[4],"Н-327");
add("linal","пр","н",6,[5],"Н-327");
add("linal","л","ч",6,[4],"Н-327");
add("linal","пр","ч",6,[5],"Н-327");
add("menedj","л","н",3,[6,7],"А-3");
add("menedj","л","ч",3,[6],"А-3");
add("menedj","пр","н",6,[4,5],"НК-431");
add("menedj","пр","ч",6,[5],"НК-524");
add("office","л","н",4,[6,7],"НК-534");
add("office","пр","н",6,[6,7],"НК-307","51А");
add("office","пр","ч",6,[6,7],"НК-307","51Б");
add("micro","л","ч",4,[6,7],"НК-549");
add("micro","пр","н",5,[6,7],"З-305");

const ONE_OFF = [
  {date:"2026-09-05",s:"fizra",t:"л",p:6,room:"НК-424",g:"51",note:"Организационное занятие"},
  {date:"2026-09-05",s:"fizra",t:"л",p:7,room:"НК-424",g:"51",note:"Организационное занятие"}
];

/* ========================= ДАТЫ ========================= */
const nowLocal = () => new Date(Date.now() + TZ*60000);
const iso = d => d.toISOString().slice(0,10);
const fromIso = s => new Date(s + "T00:00:00.000Z");
const addDays = (d,n) => new Date(d.getTime() + n*86400000);
const dow = d => { const w = d.getUTCDay(); return w===0?7:w; };
const mondayOf = d => addDays(d, -(dow(d)-1));
const minutesOf = d => d.getUTCHours()*60 + d.getUTCMinutes();
function parity(d){
  const k = Math.round((mondayOf(d) - fromIso(ANCHOR)) / 604800000);
  return ((k%2)+2)%2===0 ? "н" : "ч";
}
const termOf = (sid,t) => SUBJECTS[sid].terms.find(x=>x.t===t) || SUBJECTS[sid].terms[0];
const MON = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
const fmtDate = d => d.getUTCDate()+" "+MON[d.getUTCMonth()];
const fmtS = s => { const d=fromIso(s); return String(d.getUTCDate()).padStart(2,"0")+"."+String(d.getUTCMonth()+1).padStart(2,"0"); };
const toMin = t => { const [h,m]=t.split(":").map(Number); return h*60+m; };
function plural(n,f){ const a=n%10,b=n%100; if(a===1&&b!==11)return f[0]; if(a>=2&&a<=4&&(b<10||b>=20))return f[1]; return f[2]; }
const esc = s => String(s).replace(/[<>&]/g, c => ({"<":"&lt;",">":"&gt;","&":"&amp;"}[c]));

function lessonsOn(dateStr, sub){
  const d = fromIso(dateStr), wd = dow(d), w = parity(d), out = [];
  if (wd===7 || dateStr<SEMESTER.from || dateStr>SEMESTER.to) return out;
  for (const x of L){
    if (x.d!==wd || x.w!==w) continue;
    if (sub && x.g!=="51" && x.g!==sub) continue;
    const tr = termOf(x.s,x.t);
    if (dateStr<tr.from || dateStr>tr.to) continue;
    out.push({...x, date:dateStr});
  }
  for (const x of ONE_OFF) if (x.date===dateStr) out.push({...x, d:wd, w});
  out.sort((a,b)=>a.p-b.p);
  return out;
}
function groupPairs(list){
  const out=[];
  for (const x of list){
    const l = out[out.length-1];
    if (l && l.s===x.s && l.t===x.t && l.room===x.room && l.g===x.g && x.p===l.pEnd+1){ l.pEnd=x.p; continue; }
    out.push({...x, pEnd:x.p});
  }
  return out;
}
function roomLine(room){
  const i = room.indexOf("-");
  const b = BUILDINGS[i>0 ? room.slice(0,i) : room];
  return b ? `${room} — ${b.n}, ${b.a}` : room;
}
function mapUrl(addr){ return "https://yandex.ru/maps/?text=" + encodeURIComponent("Новосибирск, "+addr); }

/* ========================= ХРАНИЛИЩЕ ========================= */
const getJSON = async (env,k,def=null) => { try { const v = await env.KV.get(k); return v?JSON.parse(v):def; } catch { return def; } };
const putJSON = (env,k,v,o) => env.KV.put(k, JSON.stringify(v), o);

const getUser = (env,id) => getJSON(env,`u:${id}`);
const saveUser = (env,u) => putJSON(env,`u:${u.id}`,u);
async function allUsers(env){
  const out=[]; let cursor;
  do{
    const page = await env.KV.list({prefix:"u:", cursor});
    for (const k of page.keys){ const u = await getJSON(env,k.name); if(u) out.push(u); }
    cursor = page.list_complete ? null : page.cursor;
  } while(cursor);
  return out;
}
const getHw = env => getJSON(env,"hw",{});
const setHw = (env,o) => putJSON(env,"hw",o);
const isAdmin = (env,id) => String(env.ADMIN_IDS||"").split(",").map(s=>s.trim()).filter(Boolean).includes(String(id));
const adminList = env => String(env.ADMIN_IDS||"").split(",").map(s=>s.trim()).filter(Boolean);

async function bump(env, key){
  const s = await getJSON(env,"stats",{});
  s[key] = (s[key]||0)+1;
  await putJSON(env,"stats",s);
}

/* ========================= TELEGRAM ========================= */
async function api(token, method, body){
  const r = await fetch(`https://api.telegram.org/bot${token}/${method}`,{
    method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify(body)});
  return r.json().catch(()=>({}));
}
const sendMain = (env,chat,text,extra={}) =>
  api(env.BOT_TOKEN,"sendMessage",{chat_id:chat,text,parse_mode:"HTML",disable_web_page_preview:true,...extra});
const sendSup = (env,chat,text,extra={}) =>
  api(env.SUPPORT_TOKEN,"sendMessage",{chat_id:chat,text,parse_mode:"HTML",disable_web_page_preview:true,...extra});

const MENU = {keyboard:[
  [{text:"📅 Сегодня"},{text:"➡️ Завтра"}],
  [{text:"🗓 Неделя"},{text:"📊 Расписание"}],
  [{text:"📝 Домашка"},{text:"🇬🇧 Английский"}],
  [{text:"⏰ Звонки"},{text:"🏛 Корпуса"}],
  [{text:"🔔 Уведомления"},{text:"✉️ Написать"}],
  [{text:"🌐 Сайт"},{text:"⚙️ Профиль"}]
], resize_keyboard:true};

/* ========================= ТЕКСТЫ ========================= */
async function dayText(env, dateStr, title, sub){
  const d = fromIso(dateStr), w = parity(d);
  const list = groupPairs(lessonsOn(dateStr, sub));
  let head = `<b>${title}</b>\n${fmtDate(d)}, ${dow(d)===7?"воскресенье":DAYS[dow(d)].toLowerCase()}\n`
           + `${w==="н"?"🟢 нечётная":"🟣 чётная"} неделя\n`;
  if (!list.length) return head + `\n😴 Занятий нет.`;
  const hw = await getHw(env);
  const body = list.map(x=>{
    const s = SUBJECTS[x.s];
    const t1 = PAIRS[x.p][0], t2 = PAIRS[x.pEnd][1];
    const pl = x.pEnd!==x.p ? `${x.p}–${x.pEnd} пары` : `${x.p} пара`;
    const h = hw[`${x.s}_${dateStr}`];
    const online = x.s==="inyaz" ? "\n💻 дистанционно, 19:00" : "";
    return `\n━━━━━━━━━━━━━\n🕐 <b>${t1}–${t2}</b>  ·  ${pl}\n📘 <b>${esc(s.name)}</b>\n📍 ${esc(roomLine(x.room))}\n`
      + `🏷 ${x.t==="л"?"лекция":"практика"}${x.g!=="51"?" · "+x.g:""}${online}`
      + (x.note?`\nℹ️ ${esc(x.note)}`:"")
      + (h?`\n📝 <b>Задано:</b> ${esc(h.text)}`:"");
  }).join("");
  return head + body + `\n━━━━━━━━━━━━━\nВсего: ${list.length} ${plural(list.length,["пара","пары","пар"])}`;
}

function weekText(refDate, sub, wkOverride){
  const mon = mondayOf(refDate);
  const w = wkOverride || parity(refDate);
  let out = `<b>📗 Неделя</b>\n${fmtS(iso(mon))} – ${fmtS(iso(addDays(mon,5)))}\n${w==="н"?"🟢 нечётная":"🟣 чётная"}\n`;
  for (let i=0;i<6;i++){
    const ds = iso(addDays(mon,i));
    const list = groupPairs(lessonsOn(ds, sub));
    out += `\n<b>${DAYS[i+1]} · ${fmtS(ds)}</b>\n`;
    out += list.length
      ? list.map(x=>{
          const pl = x.pEnd!==x.p?`${x.p}–${x.pEnd}`:`${x.p}`;
          return `  ${PAIRS[x.p][0]} · ${esc(SUBJECTS[x.s].name)}\n  ${esc(x.room)} · ${x.t==="л"?"лек":"пр"}${x.g!=="51"?" "+x.g:""} · ${pl} п.`;
        }).join("\n")
      : "  —";
    out += "\n";
  }
  return out;
}

function fullText(wk, sub){
  let out = `<b>📊 Полное расписание</b>\n${wk==="н"?"🟢 НЕЧЁТНАЯ неделя":"🟣 ЧЁТНАЯ неделя"}\n`;
  for (let d=1; d<=6; d++){
    const list = groupPairs(L.filter(x=>x.d===d && x.w===wk && (!sub || x.g==="51" || x.g===sub))
                             .sort((a,b)=>a.p-b.p));
    out += `\n<b>${DAYS[d]}</b>\n`;
    out += list.length ? list.map(x=>{
      const pl = x.pEnd!==x.p?`${x.p}–${x.pEnd}`:`${x.p}`;
      const tr = termOf(x.s,x.t);
      return `  ${PAIRS[x.p][0]}–${PAIRS[x.pEnd][1]} · <b>${esc(SUBJECTS[x.s].name)}</b>\n  ${esc(x.room)} · ${x.t==="л"?"лекция":"практика"}${x.g!=="51"?" · "+x.g:""}\n  <i>${fmtS(tr.from)}–${fmtS(tr.to)}</i>`;
    }).join("\n") : "  —";
    out += "\n";
  }
  return out + `\n<i>Дисциплины идут не весь семестр — смотрите сроки под каждой парой.</i>`;
}

const bellsText = () =>
  `<b>⏰ Расписание звонков</b>\n\n` +
  [1,2,3,4,5,6,7].map(p => `${p} пара — ${PAIRS[p][0]}–${PAIRS[p][1]}` + (p===2?"\n\n<i>большой перерыв 40 минут</i>\n":"")).join("\n");

const buildingsText = () =>
  `<b>🏛 Учебные корпуса</b>\n\n` +
  Object.entries(BUILDINGS).map(([k,b]) =>
    `<b>${k}</b> — ${esc(b.n)}\n${esc(b.a)}\n<a href="${mapUrl(b.a)}">открыть на карте</a>`).join("\n\n");

function nextTuesday19(){
  const n = nowLocal();
  const t = new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate(), 19, 0));
  const delta = (2 - dow(n) + 7) % 7;
  t.setUTCDate(t.getUTCDate() + delta);
  if (t <= n) t.setUTCDate(t.getUTCDate() + 7);
  return t;
}
function engText(){
  const t = nextTuesday19(), ms = t - nowLocal();
  const dd = Math.floor(ms/86400000), hh = Math.floor(ms%86400000/3600000), mm = Math.floor(ms%3600000/60000);
  return `<b>🇬🇧 Английский язык</b>\n\n`
    + `👩‍🏫 Филипьева Елена Викторовна\n💻 дистанционно\n📅 по вторникам в 19:00\n`
    + `🔗 ссылку присылает перед парой\n📧 Elena7021985@yandex.ru\n\n`
    + `⏳ До следующего занятия: <b>${dd?dd+" "+plural(dd,["день","дня","дней"])+" ":""}${hh} ч ${mm} мин</b>\n`
    + `(вторник, ${fmtDate(t)})\n\n`
    + `<i>Placement test преподаватель прислала в чат группы — его нужно выполнить и отправить ей на почту. `
    + `Тренировочный тест на 60 вопросов есть на сайте: ${SITE}</i>`;
}

/* ========================= ОСНОВНОЙ БОТ ========================= */
async function mainUpdate(env, u){
  if (u.callback_query) return mainCallback(env, u.callback_query);
  const msg = u.message; if (!msg) return;
  const chat = msg.chat.id, uid = msg.from.id;
  const text = (msg.text||"").trim();
  let user = await getUser(env, uid);
  const st = await getJSON(env, `st:${uid}`);

  /* --- контакт --- */
  if (msg.contact){
    if (msg.contact.user_id && msg.contact.user_id !== uid)
      return sendMain(env, chat, "Пожалуйста, отправьте <b>свой</b> номер кнопкой ниже.");
    user = user || {id:uid, joined:new Date().toISOString(), notif:{morning:1,before:1,evening:1,hw:1}};
    user.phone = msg.contact.phone_number;
    user.name = [msg.from.first_name, msg.from.last_name].filter(Boolean).join(" ");
    user.username = msg.from.username || "";
    await saveUser(env, user);
    await env.KV.put(`st:${uid}`, JSON.stringify({mode:"reg_sub"}), {expirationTtl:3600});
    return sendMain(env, chat,
      "Спасибо! Последний шаг — выберите свою подгруппу.\n\n"
      + "<i>По ней бот покажет только ваши пары: английский и офисные приложения идут по подгруппам.</i>",
      {reply_markup:{inline_keyboard:[[{text:"51А — 1 подгруппа",callback_data:"sub:51А"}],[{text:"51Б — 2 подгруппа",callback_data:"sub:51Б"}]]}});
  }

  /* --- регистрация --- */
  if (!user || !user.phone){
    if (text==="/start" || !st || st.mode!=="reg_phone"){
      await env.KV.put(`st:${uid}`, JSON.stringify({mode:"reg_phone"}), {expirationTtl:3600});
      return sendMain(env, chat,
        `👋 <b>Привет! Это бот расписания группы 4151</b> (Экономика).\n\n`
        + `Покажу пары на сегодня и завтра, всю неделю, домашние задания, адреса корпусов `
        + `и буду напоминать перед каждой парой.\n\n`
        + `Чтобы начать, поделитесь номером телефона кнопкой ниже.\n\n`
        + `<i>Зачем: чтобы одногруппники и староста знали, кто есть кто — в Telegram у многих ник без имени. `
        + `Номер виден только администратору бота. Удалить свои данные можно командой /delete.</i>`,
        {reply_markup:{keyboard:[[{text:"📱 Поделиться номером",request_contact:true}]],resize_keyboard:true,one_time_keyboard:true}});
    }
    return sendMain(env, chat, "Нажмите кнопку «📱 Поделиться номером» внизу экрана.");
  }
  if (!user.sub){
    await env.KV.put(`st:${uid}`, JSON.stringify({mode:"reg_sub"}), {expirationTtl:3600});
    return sendMain(env, chat, "Выберите подгруппу:",
      {reply_markup:{inline_keyboard:[[{text:"51А — 1 подгруппа",callback_data:"sub:51А"}],[{text:"51Б — 2 подгруппа",callback_data:"sub:51Б"}]]}});
  }

  user.last = new Date().toISOString();
  await saveUser(env, user);

  /* --- режим написания в поддержку --- */
  if (st && st.mode==="support"){
    await env.KV.delete(`st:${uid}`);
    const rl = await env.KV.get(`rl:${uid}`);
    if (rl) return sendMain(env, chat, "Слишком часто. Подождите минуту.", {reply_markup:MENU});
    await env.KV.put(`rl:${uid}`, "1", {expirationTtl:60});
    await addTicketMsg(env, user, text, "user");
    await bump(env,"tickets");
    for (const a of adminList(env))
      await sendSup(env, a, `✉️ <b>Новое обращение</b>\n${userLine(user)}\n\n${esc(text)}`,
        {reply_markup:{inline_keyboard:[[{text:"Ответить",callback_data:`open:${uid}`}]]}});
    return sendMain(env, chat, "Отправлено ✅ Ответ придёт сюда же.", {reply_markup:MENU});
  }

  const today = iso(nowLocal());

  if (text==="/start" || text==="/menu" || text==="⚙️ Профиль"){
    if (text==="⚙️ Профиль") await bump(env,"btn_profile");
    return sendMain(env, chat,
      `<b>Ваш профиль</b>\n\n👤 ${esc(user.name||"—")}\n📱 ${esc(user.phone)}\n👥 подгруппа ${user.sub}\n`
      + `📅 с ${fmtS(user.joined.slice(0,10))}\n\n`
      + `Сайт с полным расписанием: ${SITE}`,
      {reply_markup:{...MENU, ...{}}, });
  }
  if (text==="/id") return sendMain(env, chat, `Ваш ID: <code>${uid}</code>`);
  if (text==="/delete"){
    return sendMain(env, chat, "Удалить ваш номер и профиль из бота?",
      {reply_markup:{inline_keyboard:[[{text:"Да, удалить",callback_data:"del:yes"},{text:"Отмена",callback_data:"del:no"}]]}});
  }

  if (text==="📅 Сегодня"){ await bump(env,"btn_today");
    return sendMain(env, chat, await dayText(env, today, "📅 Сегодня", user.sub), {reply_markup:MENU}); }
  if (text==="➡️ Завтра"){ await bump(env,"btn_tomorrow");
    return sendMain(env, chat, await dayText(env, iso(addDays(nowLocal(),1)), "➡️ Завтра", user.sub), {reply_markup:MENU}); }
  if (text==="🗓 Неделя"){ await bump(env,"btn_week");
    return sendMain(env, chat, weekText(nowLocal(), user.sub), {reply_markup:{inline_keyboard:[[
      {text:"◀ Прошлая",callback_data:"wk:-1"},{text:"Следующая ▶",callback_data:"wk:1"}]]}}); }
  if (text==="📊 Расписание"){ await bump(env,"btn_full");
    return sendMain(env, chat, fullText(parity(nowLocal()), user.sub), {reply_markup:{inline_keyboard:[[
      {text:"🟢 Нечётная",callback_data:"fl:н"},{text:"🟣 Чётная",callback_data:"fl:ч"}]]}}); }
  if (text==="⏰ Звонки") return sendMain(env, chat, bellsText(), {reply_markup:MENU});
  if (text==="🏛 Корпуса") return sendMain(env, chat, buildingsText(), {reply_markup:MENU});
  if (text==="🇬🇧 Английский"){ await bump(env,"btn_eng");
    return sendMain(env, chat, engText(), {reply_markup:MENU}); }
  if (text==="🌐 Сайт")
    return sendMain(env, chat, `Полное расписание, состав подгрупп, тренировочный тест по английскому:\n${SITE}`, {reply_markup:MENU});

  if (text==="📝 Домашка"){ await bump(env,"btn_hw");
    return sendMain(env, chat, "<b>📝 Домашние задания</b>\nВыберите занятие:", {reply_markup: await hwKeyboard(env, user.sub, isAdmin(env,uid))}); }

  if (text==="🔔 Уведомления") return sendMain(env, chat, notifText(user), {reply_markup: notifKb(user)});

  if (text==="✉️ Написать"){
    await env.KV.put(`st:${uid}`, JSON.stringify({mode:"support"}), {expirationTtl:900});
    return sendMain(env, chat,
      "Напишите одним сообщением, что случилось или что предлагаете — ошибка в расписании, пожелание, вопрос.\n\n"
      + "<i>Сообщение попадёт администратору, ответ придёт сюда.</i>", {reply_markup:{remove_keyboard:true}});
  }

  if (text==="/stats" && isAdmin(env,uid)) return sendMain(env, chat, await statsText(env), {reply_markup:MENU});

  return sendMain(env, chat, "Выберите пункт меню 👇", {reply_markup:MENU});
}

const notifText = u =>
  `<b>🔔 Уведомления</b>\n\nВыберите, что присылать:\n\n`
  + `☀️ Утренняя сводка в 07:30 — ${u.notif.morning?"вкл":"выкл"}\n`
  + `⏰ За 20 минут до пары — ${u.notif.before?"вкл":"выкл"}\n`
  + `🌙 Вечером о завтрашнем дне — ${u.notif.evening?"вкл":"выкл"}\n`
  + `📝 Новая домашка — ${u.notif.hw?"вкл":"выкл"}`;
const notifKb = u => ({inline_keyboard:[
  [{text:`${u.notif.morning?"✅":"⬜️"} Утренняя сводка`,callback_data:"nt:morning"}],
  [{text:`${u.notif.before?"✅":"⬜️"} За 20 минут до пары`,callback_data:"nt:before"}],
  [{text:`${u.notif.evening?"✅":"⬜️"} Вечером о завтра`,callback_data:"nt:evening"}],
  [{text:`${u.notif.hw?"✅":"⬜️"} Новая домашка`,callback_data:"nt:hw"}]
]});

async function hwKeyboard(env, sub, admin){
  const hw = await getHw(env), rows = [];
  const start = nowLocal();
  for (let i=0;i<14 && rows.length<12;i++){
    const ds = iso(addDays(start,i));
    for (const x of groupPairs(lessonsOn(ds, sub))){
      rows.push([{text:`${hw[`${x.s}_${ds}`]?"📝 ":""}${fmtS(ds)} · ${SUBJECTS[x.s].name}`, callback_data:`hw:${x.s}:${ds}`}]);
      if (rows.length>=12) break;
    }
  }
  if (!rows.length) rows.push([{text:"Ближайших занятий нет",callback_data:"noop"}]);
  return {inline_keyboard:rows};
}

async function mainCallback(env, cq){
  const chat = cq.message.chat.id, uid = cq.from.id, data = cq.data||"";
  await api(env.BOT_TOKEN,"answerCallbackQuery",{callback_query_id:cq.id});
  let user = await getUser(env, uid);

  if (data.startsWith("sub:")){
    if (!user) return;
    user.sub = data.slice(4);
    user.notif = user.notif || {morning:1,before:1,evening:1,hw:1};
    await saveUser(env, user);
    await env.KV.delete(`st:${uid}`);
    await bump(env,"registered");
    for (const a of adminList(env))
      await sendSup(env, a, `🆕 <b>Новый пользователь</b>\n${userLine(user)}`);
    return sendMain(env, chat,
      `Готово! 🎉 Вы в подгруппе <b>${user.sub}</b>.\n\n`
      + `Каждое утро в 07:30 пришлю пары на день и напомню за 20 минут до каждой.\n\n`
      + `Полное расписание, состав подгрупп и тренировочный тест по английскому — на сайте ${SITE}`,
      {reply_markup:MENU});
  }
  if (!user || !user.sub) return;

  if (data.startsWith("nt:")){
    const k = data.slice(3);
    user.notif[k] = user.notif[k] ? 0 : 1;
    await saveUser(env, user);
    return api(env.BOT_TOKEN,"editMessageText",{chat_id:chat,message_id:cq.message.message_id,
      text:notifText(user),parse_mode:"HTML",reply_markup:notifKb(user)});
  }
  if (data.startsWith("wk:")){
    const shift = +data.slice(3);
    const base = addDays(nowLocal(), shift*7);
    return sendMain(env, chat, weekText(base, user.sub), {reply_markup:{inline_keyboard:[[
      {text:"◀ Прошлая",callback_data:`wk:${shift-1}`},{text:"Следующая ▶",callback_data:`wk:${shift+1}`}]]}});
  }
  if (data.startsWith("fl:")){
    const wk = data.slice(3);
    return api(env.BOT_TOKEN,"editMessageText",{chat_id:chat,message_id:cq.message.message_id,
      text:fullText(wk,user.sub),parse_mode:"HTML",reply_markup:{inline_keyboard:[[
        {text:"🟢 Нечётная",callback_data:"fl:н"},{text:"🟣 Чётная",callback_data:"fl:ч"}]]}});
  }
  if (data.startsWith("hw:")){
    const [,sid,date] = data.split(":");
    const hw = await getHw(env), h = hw[`${sid}_${date}`];
    return sendMain(env, chat,
      `<b>${esc(SUBJECTS[sid].name)}</b>\n${fmtS(date)}\n\n` + (h?esc(h.text):"<i>Задание не записано.</i>"),
      {reply_markup:MENU});
  }
  if (data==="del:yes"){
    await env.KV.delete(`u:${uid}`); await env.KV.delete(`st:${uid}`);
    return sendMain(env, chat, "Ваши данные удалены. Чтобы вернуться — /start", {reply_markup:{remove_keyboard:true}});
  }
  if (data==="del:no") return sendMain(env, chat, "Отменено.", {reply_markup:MENU});
}

/* ========================= ТИКЕТЫ ========================= */
const userLine = u =>
  `👤 ${esc(u.name||"—")}${u.username?` (@${u.username})`:""}\n📱 ${esc(u.phone||"—")} · 👥 ${u.sub||"—"} · id <code>${u.id}</code>`;

async function addTicketMsg(env, user, text, who){
  const t = await getJSON(env, `t:${user.id}`, {id:user.id, msgs:[], unread:0, status:"open"});
  t.msgs.push({who, text, at:new Date().toISOString()});
  if (t.msgs.length>50) t.msgs = t.msgs.slice(-50);
  if (who==="user"){ t.unread = (t.unread||0)+1; t.status="open"; }
  t.last = new Date().toISOString();
  t.name = user.name; t.username = user.username; t.phone = user.phone; t.sub = user.sub;
  await putJSON(env, `t:${user.id}`, t);
}
async function allTickets(env){
  const out=[]; let cursor;
  do{
    const page = await env.KV.list({prefix:"t:", cursor});
    for (const k of page.keys){ const t = await getJSON(env,k.name); if(t) out.push(t); }
    cursor = page.list_complete ? null : page.cursor;
  } while(cursor);
  out.sort((a,b)=>(b.last||"").localeCompare(a.last||""));
  return out;
}

/* ========================= БОТ ПОДДЕРЖКИ ========================= */
const SUP_MENU = {keyboard:[
  [{text:"💬 Диалоги"},{text:"📊 Статистика"}],
  [{text:"📝 Домашка"},{text:"📢 Рассылка"}]
], resize_keyboard:true};

async function supUpdate(env, u){
  if (u.callback_query) return supCallback(env, u.callback_query);
  const msg = u.message; if (!msg) return;
  const chat = msg.chat.id, uid = msg.from.id, text = (msg.text||"").trim();
  const admin = isAdmin(env, uid);
  const st = await getJSON(env, `sst:${uid}`);

  /* --- обычный студент пишет в поддержку --- */
  if (!admin){
    if (text==="/start")
      return sendSup(env, chat, `👋 Это поддержка группы 4151.\n\nНапишите сюда вопрос, проблему или предложение — администратор ответит.\n\nОсновной бот: @${MAIN_BOT}\nСайт: ${SITE}`);
    if (!text) return;
    const rl = await env.KV.get(`rl:s${uid}`);
    if (rl) return sendSup(env, chat, "Слишком часто. Подождите минуту.");
    await env.KV.put(`rl:s${uid}`, "1", {expirationTtl:60});
    let user = await getUser(env, uid) || {id:uid, name:[msg.from.first_name,msg.from.last_name].filter(Boolean).join(" "), username:msg.from.username||""};
    await addTicketMsg(env, user, text, "user");
    for (const a of adminList(env))
      await sendSup(env, a, `✉️ <b>Новое обращение</b>\n${userLine(user)}\n\n${esc(text)}`,
        {reply_markup:{inline_keyboard:[[{text:"Ответить",callback_data:`open:${uid}`}]]}});
    return sendSup(env, chat, "Принято ✅ Ответ придёт сюда.");
  }

  /* --- админ --- */
  if (text==="/start" || text==="/menu"){
    await env.KV.delete(`sst:${uid}`);
    return sendSup(env, chat, `🛠 <b>Панель администратора</b>\nГруппа 4151 · ${SITE}`, {reply_markup:SUP_MENU});
  }

  if (st && st.mode==="reply"){
    if (text==="/stop"){ await env.KV.delete(`sst:${uid}`); return sendSup(env, chat, "Диалог закрыт.", {reply_markup:SUP_MENU}); }
    const target = await getUser(env, st.to);
    await sendMain(env, st.to, `💬 <b>Ответ администратора</b>\n\n${esc(text)}`, {reply_markup:MENU})
      .catch(()=>{});
    await addTicketMsg(env, target || {id:st.to}, text, "admin");
    return sendSup(env, chat, "Отправлено ✅\n<i>Пишите ещё или /stop чтобы закрыть диалог.</i>");
  }
  if (st && st.mode==="bcast"){
    await env.KV.delete(`sst:${uid}`);
    const users = await allUsers(env);
    let ok=0;
    for (const us of users){
      const r = await sendMain(env, us.id, `📢 <b>Объявление</b>\n\n${esc(text)}`, {reply_markup:MENU});
      if (r && r.ok) ok++;
    }
    return sendSup(env, chat, `Рассылка отправлена: ${ok} из ${users.length}.`, {reply_markup:SUP_MENU});
  }
  if (st && st.mode==="hw"){
    await env.KV.delete(`sst:${uid}`);
    const hw = await getHw(env), key = `${st.sid}_${st.date}`;
    if (text==="-" || text.toLowerCase()==="удалить") delete hw[key];
    else hw[key] = {text, at:new Date().toISOString()};
    await setHw(env, hw);
    if (hw[key]){
      const users = await allUsers(env);
      for (const us of users) if (us.notif && us.notif.hw)
        await sendMain(env, us.id, `📝 <b>Новая домашка</b>\n${esc(SUBJECTS[st.sid].name)} · ${fmtS(st.date)}\n\n${esc(text)}`, {reply_markup:MENU});
    }
    return sendSup(env, chat, `Сохранено ✅ ${esc(SUBJECTS[st.sid].name)}, ${fmtS(st.date)}`, {reply_markup:SUP_MENU});
  }

  if (text==="💬 Диалоги"){
    const ts = await allTickets(env);
    if (!ts.length) return sendSup(env, chat, "Обращений пока нет.", {reply_markup:SUP_MENU});
    const rows = ts.slice(0,20).map(t=>[{text:`${t.unread?`🔴 ${t.unread} · `:""}${t.name||t.id}${t.sub?` · ${t.sub}`:""}`, callback_data:`open:${t.id}`}]);
    return sendSup(env, chat, `<b>💬 Диалоги</b>\nВсего: ${ts.length}`, {reply_markup:{inline_keyboard:rows}});
  }
  if (text==="📊 Статистика") return sendSup(env, chat, await statsText(env), {reply_markup:SUP_MENU});
  if (text==="📢 Рассылка"){
    await env.KV.put(`sst:${uid}`, JSON.stringify({mode:"bcast"}), {expirationTtl:900});
    return sendSup(env, chat, "Напишите текст объявления — он уйдёт всем пользователям бота.");
  }
  if (text==="📝 Домашка"){
    const hw = await getHw(env), rows = [];
    const start = nowLocal();
    for (let i=0;i<14 && rows.length<12;i++){
      const ds = iso(addDays(start,i));
      for (const x of groupPairs(lessonsOn(ds))){
        rows.push([{text:`${hw[`${x.s}_${ds}`]?"📝 ":""}${fmtS(ds)} · ${SUBJECTS[x.s].name}`, callback_data:`shw:${x.s}:${ds}`}]);
        if (rows.length>=12) break;
      }
    }
    return sendSup(env, chat, "Выберите занятие, чтобы записать задание:", {reply_markup:{inline_keyboard:rows}});
  }
  return sendSup(env, chat, "Выберите пункт меню 👇", {reply_markup:SUP_MENU});
}

async function supCallback(env, cq){
  const chat = cq.message.chat.id, uid = cq.from.id, data = cq.data||"";
  await api(env.SUPPORT_TOKEN,"answerCallbackQuery",{callback_query_id:cq.id});
  if (!isAdmin(env, uid)) return;

  if (data.startsWith("open:")){
    const id = data.slice(5);
    const t = await getJSON(env, `t:${id}`, {msgs:[]});
    t.unread = 0; await putJSON(env, `t:${id}`, t);
    await env.KV.put(`sst:${uid}`, JSON.stringify({mode:"reply", to:id}), {expirationTtl:7200});
    const hist = t.msgs.slice(-12).map(m=>`${m.who==="user"?"👤":"🛠"} ${esc(m.text)}`).join("\n\n") || "—";
    return sendSup(env, chat,
      `<b>Диалог</b>\n${userLine(t)}\n\n${hist}\n\n<i>Напишите ответ. /stop — закрыть диалог.</i>`,
      {reply_markup:{inline_keyboard:[[{text:"✅ Закрыть обращение",callback_data:`close:${id}`}]]}});
  }
  if (data.startsWith("close:")){
    const id = data.slice(6);
    const t = await getJSON(env, `t:${id}`, {});
    t.status = "closed"; t.unread = 0; await putJSON(env, `t:${id}`, t);
    await env.KV.delete(`sst:${uid}`);
    return sendSup(env, chat, "Обращение закрыто ✅", {reply_markup:SUP_MENU});
  }
  if (data.startsWith("shw:")){
    const [,sid,date] = data.split(":");
    await env.KV.put(`sst:${uid}`, JSON.stringify({mode:"hw", sid, date}), {expirationTtl:900});
    return sendSup(env, chat, `Напишите задание по предмету <b>${esc(SUBJECTS[sid].name)}</b> на ${fmtS(date)}.\nЧтобы удалить — отправьте «-».`);
  }
}

/* ========================= СТАТИСТИКА ========================= */
async function statsText(env){
  const users = await allUsers(env);
  const now = Date.now();
  const act = (d) => users.filter(u=>u.last && now-new Date(u.last) < d*86400000).length;
  const s = await getJSON(env,"stats",{});
  const tickets = await allTickets(env);
  const a = users.filter(u=>u.sub==="51А").length, b = users.filter(u=>u.sub==="51Б").length;
  const today0 = iso(nowLocal());
  const newToday = users.filter(u=>u.joined && u.joined.slice(0,10)===today0).length;
  const notif = k => users.filter(u=>u.notif && u.notif[k]).length;
  const top = Object.entries(s).filter(([k])=>k.startsWith("btn_"))
    .sort((x,y)=>y[1]-x[1]).slice(0,5)
    .map(([k,v])=>`  ${k.replace("btn_","")} — ${v}`).join("\n") || "  —";
  return `<b>📊 Статистика</b>\n\n`
    + `👥 Всего пользователей: <b>${users.length}</b> из 19 в группе\n`
    + `🆕 Сегодня пришли: ${newToday}\n`
    + `🔥 Активны 7 дней: ${act(7)}\n📉 Активны 30 дней: ${act(30)}\n\n`
    + `👤 Подгруппы: 51А — ${a}, 51Б — ${b}${users.length-a-b?`, не указали — ${users.length-a-b}`:""}\n\n`
    + `🔔 Уведомления:\n  утро — ${notif("morning")}\n  перед парой — ${notif("before")}\n  вечер — ${notif("evening")}\n  домашка — ${notif("hw")}\n\n`
    + `✉️ Обращений: ${tickets.length} (открытых ${tickets.filter(t=>t.status!=="closed").length})\n\n`
    + `📈 Популярные разделы:\n${top}`;
}

/* ========================= РАССЫЛКИ ПО РАСПИСАНИЮ ========================= */
async function cron(env){
  const n = nowLocal(), ds = iso(n), mins = minutesOf(n);
  const users = await allUsers(env);
  if (!users.length) return;
  const hw = await getHw(env);

  const once = async (key, fn) => {
    if (await env.KV.get(key)) return;
    await env.KV.put(key, "1", {expirationTtl:172800});
    await fn();
  };

  /* утренняя сводка 07:30 */
  if (mins>=MORNING && mins<MORNING+10){
    await once(`c:m:${ds}`, async () => {
      for (const u of users){
        if (!u.notif || !u.notif.morning || !u.sub) continue;
        await sendMain(env, u.id, await dayText(env, ds, "☀️ Доброе утро! Сегодня", u.sub), {reply_markup:MENU});
      }
    });
  }
  /* вечерняя сводка 21:00 */
  if (mins>=EVENING && mins<EVENING+10){
    await once(`c:e:${ds}`, async () => {
      const tm = iso(addDays(n,1));
      for (const u of users){
        if (!u.notif || !u.notif.evening || !u.sub) continue;
        if (!lessonsOn(tm, u.sub).length) continue;
        await sendMain(env, u.id, await dayText(env, tm, "🌙 Завтра", u.sub), {reply_markup:MENU});
      }
    });
  }
  /* английский: вторник 18:45 */
  if (dow(n)===2 && mins>=ENG_PING && mins<ENG_PING+10){
    await once(`c:eng:${ds}`, async () => {
      for (const u of users){
        if (!u.notif || !u.notif.before) continue;
        await sendMain(env, u.id, `🇬🇧 <b>Через 15 минут — английский</b>\n\n💻 Дистанционно, 19:00\n👩‍🏫 Филипьева Елена Викторовна\n🔗 Ссылка — в чате группы`, {reply_markup:MENU});
      }
    });
  }
  /* за 20 минут до пары */
  for (const sub of ["51А","51Б"]){
    for (const x of groupPairs(lessonsOn(ds, sub))){
      const diff = toMin(PAIRS[x.p][0]) - mins;
      if (diff>20 || diff<=10) continue;
      await once(`c:p:${ds}:${sub}:${x.p}`, async () => {
        const s = SUBJECTS[x.s], h = hw[`${x.s}_${ds}`];
        const txt = `⏰ <b>Через 20 минут</b>\n\n📘 <b>${esc(s.name)}</b>\n`
          + `🕐 ${PAIRS[x.p][0]}–${PAIRS[x.pEnd][1]} · ${x.p}${x.pEnd!==x.p?"–"+x.pEnd:""} пара\n`
          + `📍 ${esc(roomLine(x.room))}\n🏷 ${x.t==="л"?"лекция":"практика"}${x.g!=="51"?" · "+x.g:""}`
          + (x.s==="inyaz"?"\n💻 дистанционно":"")
          + (h?`\n\n📝 <b>Задано:</b> ${esc(h.text)}`:"");
        for (const u of users){
          if (u.sub!==sub || !u.notif || !u.notif.before) continue;
          await sendMain(env, u.id, txt, {reply_markup:MENU});
        }
      });
    }
  }
}

/* ========================= ТОЧКА ВХОДА ========================= */
export default {
  async fetch(request, env){
    const url = new URL(request.url);

    if (url.pathname==="/setup" && url.searchParams.get("key")===env.WEBHOOK_SECRET){
      const r1 = await api(env.BOT_TOKEN,"setWebhook",{url:`${url.origin}/main`,secret_token:env.WEBHOOK_SECRET,allowed_updates:["message","callback_query"]});
      const r2 = await api(env.SUPPORT_TOKEN,"setWebhook",{url:`${url.origin}/support`,secret_token:env.WEBHOOK_SECRET,allowed_updates:["message","callback_query"]});
      await api(env.BOT_TOKEN,"setMyCommands",{commands:[
        {command:"start",description:"Меню"},{command:"delete",description:"Удалить мои данные"},{command:"id",description:"Мой ID"}]});
      return new Response(JSON.stringify({main:r1, support:r2}, null, 2), {headers:{"content-type":"application/json"}});
    }

    if (request.method==="POST" && (url.pathname==="/main" || url.pathname==="/support")){
      if (request.headers.get("x-telegram-bot-api-secret-token")!==env.WEBHOOK_SECRET)
        return new Response("no",{status:403});
      const upd = await request.json();
      try{
        if (url.pathname==="/main") await mainUpdate(env, upd);
        else await supUpdate(env, upd);
      }catch(e){ console.log("ERR", e && e.stack || e); }
      return new Response("ok");
    }

    return new Response(`Боты группы 4151 работают.\n${SITE}`, {headers:{"content-type":"text/plain; charset=utf-8"}});
  },
  async scheduled(event, env, ctx){ ctx.waitUntil(cron(env)); }
};

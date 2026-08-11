/*
 * O‘zbekcha — tabiiy o‘zbek tili, ruschadan so‘zma-so‘z ko‘chirma emas.
 * Tuzilma `Dict = typeof ru` orqali kompilyatsiya bosqichida tekshiriladi.
 */
import type { Dict } from './ru';

export const uz: Dict = {
  meta: {
    title: 'Echelon Desktop — butun biznesingizni yodida tutadigan shaxsiy yordamchi',
    description:
      'Biznes egasining shaxsiy yordamchisi. Kompyuteringizda yashaydi, odamlar-u kelishuvlarni eslab qoladi, kundalik ishni o’zi boshlab, oxirigacha yetkazadi. Qarorni sizga qoldiradi. Demo — 30 daqiqalik jonli suhbat, hech narsa o’rnatish shart emas.',
  },

  nav: {
    skip: 'Asosiy qismga o’tish',
    cta: 'Demoni ko’rish',
    ctaState: 'So’rov tayyor',
    langLabel: 'Til',
    sections: 'Bo’limlar',
    reset: 'Sessiyani boshidan boshlash',
  },

  intro: {
    label: 'Smena ketyapti',
    skip: 'O’tkazib yuborish',
    beats: [
      { time: '08:58:02', state: 'KELDI', detail: 'mijoz · Telegram' },
      { time: '08:58:03', state: 'ANIQLANDI', detail: 'yetkazib berish so’rovi' },
      { time: '08:58:04', state: 'KONTEKST TOPILDI', detail: 'Alisher · 12-mart' },
      { time: '08:58:06', state: 'HARAKAT TAYYOR', detail: 'javob tuzildi' },
    ],
  },

  seams: {
    day: { time: '09:00', state: 'Smena boshlandi', note: 'siz hali kompyuter oldida emassiz' },
    night: { time: '23:00', state: 'Tungi smena', note: 'bundan keyin u yolg’iz ishlaydi' },
    dawn: { time: '07:00', state: 'Smena topshirildi', note: 'hisobot sizni kutib turibdi' },
  },

  hero: {
    status: 'Egasi joyida yo’q',
    display: 'Biznes\nishlayapti.',
    sub: 'Echelon Desktop — biznes egasining shaxsiy yordamchisi. Kompyuteringizda yashaydi, odamlaringiz va kelishuvlaringizni yodida tutadi, kundalik ishni o’zi boshlab oxirigacha yetkazadi. Qaror sizniki bo’lib qoladi.',
    cta: 'Demoni o’z biznesingizda ko’ring',
    ctaState: 'So’rov tayyor',
    ctaNote: 'Jonli suhbat, 30 daqiqa. Hech narsa o’rnatish shart emas.',
    proof:
      '2026-yil aprelida o’ylab topilgan. Iyuldan beri birinchi to’lovchi mijozda har kuni ishlab turibdi.',
    feedLabel: 'Ish tasmasi',
    scrollHint: 'Pastga suring — smena davom etyapti',
  },

  load: {
    label: 'Undan oldin',
    title: 'Biznes xotirangizga suyanib turibdi',
    beats: [
      'Odamlar beshta chatdan yozadi. Javobni hammasi aynan sizdan kutadi.',
      'Kunlik raqamlarni so’ramaguningizcha hech kim yubormaydi.',
      'Kelishuvlarning yarmi faqat boshingizda: bir hafta yo’q bo’lsangiz — ish to’xtaydi.',
    ],
    queueLabel: 'Sizdan javob kutyapti',
    messages: [
      { from: 'Buxgalter', text: 'Kechqurun tashlab beraman, ulgurmayapman', at: '08:14' },
      { from: 'Boshqaruvchi', text: 'Yetkazib beruvchi bilan nima deb kelishgandik?', at: '08:31' },
      { from: 'Mijoz', text: 'Assalomu alaykum, buyurtma bo’yicha javob bo’ladimi?', at: '08:47' },
      { from: 'Prorab', text: 'Obyektdagi fotolarni qayerga yuboray?', at: '08:52' },
      { from: 'Hamkor', text: 'Buni martda gaplashgan edik-ku', at: '08:55' },
      { from: 'Menejer', text: 'Narxlar bo’yicha nima qaror qilgandik?', at: '08:58' },
    ],
    countLabel: 'javobsiz',
    count: '24',
    closing: 'Ularning har biri — faqat bitta odam qabul qila oladigan kichik qaror.',
  },

  teach: {
    label: 'U o’rganadi',
    title: 'Unga hozir bitta qoida o’rgating',
    prompt:
      'Sahifaning quyi qismida u sizning mijozingizga javob yozadi. Qanday yozishini ayting. Bir bosish — va u buni eslab qoladi.',
    question: 'Mijozlarga qanday javob bersin?',
    options: [
      { id: 'concise', label: 'Qisqa', desc: 'ortiqcha gapsiz, mazmunan' },
      { id: 'formal', label: 'Rasmiy', desc: 'to’liq jumlalar bilan, hurmat bilan' },
      { id: 'skip', label: 'Qoida kerak emas', desc: 'o’zi hal qilsin' },
    ],
    stampLabel: 'Qoida',
    stampId: '014',
    saved: 'Saqlandi',
    savedNames: {
      concise: 'Mijozlarga xabar · qisqa',
      formal: 'Mijozlarga xabar · rasmiy',
      skip: 'Qoida berilmadi',
    },
    after:
      'Tamom. Boshqa so’ramaydi. Sahifaning quyi qismida bu qoida qayerga tushganini ko’rasiz.',
    changeNote: 'Xohlasangiz o’zgartiring — boshqa variantni bosing.',
  },

  pillars: {
    label: 'Bu nimaga tayanadi',
    title: 'U dasturday emas, yordamchiday qurilgan',
    proofLabel: 'Ko’rsatiladi',
    items: [
      {
        name: 'Eslab qoladi',
        text: 'Kim nima va’da bergan, martda nima kelishilgan — hammasi yodida. Bu xotira oynani yopsangiz o’chmaydi, yangi chatda nolga tushmaydi.',
        at: '15:00',
        href: '#memory',
      },
      {
        name: 'Bajaradi',
        text: 'Maslahat berib o’tirmaydi — qiladi: odamlarga o’zi yozadi, raqamlarni yig’adi, jim qolganlarga eslatadi, so’rovlarni CRMga kiritadi. Sizga tekshirish qoladi — o’zingiz qilib o’tirish emas.',
        at: '17:00',
        href: '#automate',
      },
      {
        name: 'O’rganadi',
        text: 'Bir marta «mijozlarga qisqa yoz» deysiz — bu unga umrbod qoida. Bir oydan keyin ishni xuddi o’zingizday qiladi.',
        at: '18:20',
        href: '#client',
      },
      {
        name: 'Kechasi ham ishlaydi',
        text: 'Svodka 9:00gacha Telegramingizda. Kunduzi qo’l tegmaydigan ishlarni kechasi qiladi. Jadvalini o’zi eslab yuradi.',
        at: '23:20',
        href: '#night',
      },
      {
        name: 'Sizniki',
        text: 'Kompyuteringizda yashaydi. Yozishmalar, xotira, raqamlar o’zingizda qoladi — birovning bulutida emas. Ishdan bo’shab, bilganini olib keta olmaydi.',
        at: '19:40',
        href: '#boundary',
      },
    ],
  },

  day: {
    label: 'O’sha kun',
    title: 'Bu safar siz dispetcher emas, egasisiz',
    intro: 'Chapda vaqt ketyapti. O’ngda — u sizsiz qilgan ishlar.',
    tapeLabel: 'Smenada bajarildi',
    scenes: [
      {
        time: '09:00',
        state: 'SVODKA',
        title: 'Svodka allaqachon tayyor',
        text: 'Siz uxlayotganingizda u pochta va chatlarni ko’rib chiqdi. Nima bo’ldi, nima to’xtab qoldi, kim javob kutyapti — yigirmata bildirishnoma o’rniga bitta sahifa. Soat 9:00da u Telegramingizda, birinchi qo’ng’iroqdan oldin.',
        fragment: {
          kind: 'briefing' as const,
          tag: 'o’zi',
          label: 'Svodka',
          title: 'Ertalabki svodka',
          lines: [
            'Yetkazib beruvchi payshanbaga jo’natishni tasdiqladi',
            'Tunda 2 ta yangi so’rov — ikkalasi ham ishda',
            '№214 hisob-faktura shartnomaga to’g’ri kelmayapti — 3-bandga qarang',
          ],
        },
      },
      {
        time: '10:00',
        state: 'HISOBOTLAR',
        title: 'Hisobotni u yig’di, siz emas',
        text: 'Har bir ishchiga o’zi, o’sha odamning messenjeriga yozdi va javoblarni yig’di. Jim qolganlarga yana eslatdi. Sizga umumiy manzara keldi: nima bajarildi va kim ushlab turibdi.',
        fragment: {
          kind: 'messenger' as const,
          out: 'Xayrli tong! Chilonzor bo’yicha bugun ahvol qanday?',
          in1: 'Suvoq 80%, ertaga yopamiz',
          in2: 'Elektrika to’xtadi — kabel yo’q',
          note: 'Temur jim — 12:00da eslataman',
        },
      },
      {
        time: '12:00',
        state: 'HARAKAT',
        title: 'Temur baribir javob bermadi',
        text: 'Odatda shu yerda siz kimdir javob bermaganini eslaysiz. Bu safar eslash shart emas: u vazifani ochdi, eslatmani tanladi, yubordi va holatni yangiladi. Siz buni tasmadan bildingiz.',
        fragment: {
          kind: 'act' as const,
          person: 'Temur',
          status: 'Javob yo’q · 2 soat',
          steps: [
            '«Chilonzor hisoboti» vazifasini ochdi',
            'Sizning yozishmangizdan eslatmani tanladi',
            'Telegramga yubordi',
            'Holatni yangiladi',
          ],
          done: 'Bajarildi',
        },
      },
      {
        time: '19:00',
        state: 'RAQAMLAR',
        title: 'Kunlik raqamlar to’g’ri keldi',
        text: 'Buxgalterda bir xil raqam, kassada boshqa. U hammaning oldiga bordi, ma’lumotni oldi, yetishmaganini qayta so’radi. Sizga o’nta xabar emas, tayyor hisobot keldi.',
        fragment: {
          kind: 'report' as const,
          title: 'Kunlik raqamlar',
          rows: [
            { label: 'Kassa, zal', value: '4 120 000' },
            { label: 'Yetkazib berish', value: '1 890 000' },
            { label: 'Naqdsiz', value: '2 240 000' },
          ],
          note: 'Zarina ekvayringni yubormadi — qayta so’radim, 20:00gacha qo’shaman',
        },
      },
    ],
  },

  memory: {
    label: 'U eslab qoladi',
    title: 'Hech narsa tushib qolmaydigan xotira',
    copy: 'Bu «chat tarixi» emas. Odamlar, loyihalar, kelishuvlar va sanalar — bir-biriga bog’langan holda. Oynani yopsangiz o’chmaydi, yangi suhbatda nolga tushmaydi.',
    columns: { entity: 'Kim va nima', kind: 'Turi', detail: 'Nima yozilgan', when: 'Qachon' },
    kinds: {
      person: 'Odam',
      project: 'Loyiha',
      deal: 'Kelishuv',
      rule: 'Qoida',
    },
    entities: [
      {
        id: 'alisher',
        name: 'Alisher',
        kind: 'person' as const,
        detail: 'Blok yetkazib beruvchi · 14 kun muddat, 50 blokdan yuqorisiga yetkazish o’zidan',
        when: '12-mart',
        note: 'Sizning gapingizdan emas, yozishmadan olingan',
      },
      {
        id: 'chilanzar',
        name: 'Chilonzor obyekti',
        kind: 'project' as const,
        detail: 'Suvoq 80% · elektrika kabel kutyapti',
        when: '3 soat oldin',
        note: 'Brigadirlar hisobotidan yangilanadi',
      },
      {
        id: 'timur',
        name: 'Temur',
        kind: 'person' as const,
        detail: 'Brigadir · kech javob beradi, 12:00da eslatish kerak',
        when: 'bugun',
        note: 'Buni ikki hafta ichida o’zi payqadi',
      },
      {
        id: 'reports',
        name: 'Hisobot qoidasi',
        kind: 'rule' as const,
        detail: 'Brigadirlar — dushanba 10:00, foto bilan',
        when: 'iyul',
        note: 'Siz buni bir marta aytgansiz',
      },
    ],
    askLabel: 'Odamdan so’ragandek so’rang',
    question: 'Alisher bilan nimaga kelishgandik?',
    answer:
      '12-martdan boshlab 14 kun muddat. 50 blokdan yuqorisiga yetkazish uning hisobidan. 12-mart yozishmasidan olingan — iqtibos keltiraymi?',
    recallLabel: 'Esladi',
    recallNote: 'Bu yozuvni yuqorida ko’rgansiz. U ham ko’rgan.',
  },

  automate: {
    label: 'U avtomatlashtiradi',
    title: 'Bir marta aytdingiz — qoida bo’ldi',
    lead: 'Sozlama ham, konstruktor ham yo’q. Odamga qanday aytsangiz, shunday aytasiz:',
    sentence:
      'Har dushanba ertalab 10da brigadirlardan obyektlarda nima qilinganini so’rab, menga jadval qilib yubor.',
    breakdownLabel: 'Qismlarga ajratadi',
    tokens: [
      { source: 'Har dushanba', target: 'DSH', kind: 'qachon' },
      { source: 'ertalab 10da', target: '10:00', kind: 'soat nechada' },
      { source: 'brigadirlardan', target: 'Temur · Rustam · Sherzod', kind: 'kimdan' },
      { source: 'obyektlarda nima qilinganini so’rab,', target: 'Bajarilgani', kind: 'nimani yig’ish' },
      { source: 'menga jadval qilib yubor.', target: 'Hisobot → sizga', kind: 'nima qilish' },
    ],
    orderLabel: 'Topshiriq',
    orderId: '018',
    orderLine: 'DSH · 10:00 · ODAMLAR · BAJARILGANI · HISOBOT',
    orderState: 'Ishlayapti',
    result: 'Tamom. Endi bu har dushanba o’zi bo’lib turadi.',
    correctionLabel: 'Tuzatish',
    correction: '«Sakkizda yubor, obyekt fotosini qo’sh» — keyingi dushanbadan shunday.',
    explain:
      'Oddiy dastur faqat dasturchi kiritgan narsani qiladi. Bu yerda esa u nimani bilishini o’zingiz hal qilasiz — oddiy so’z bilan. Shuning uchun shaurmaxona bilan qurilish firmasidan ikki xil yordamchi chiqadi: ularni hech kim oldindan o’ylab qo’ygani yo’q.',
    switcherLabel: 'O’z biznesingiz misolida ko’ring',
    businesses: [
      {
        id: 'restaurant',
        name: 'Restoran',
        cases: [
          'Har kuni kechqurun kassa, zal va yetkazib berish tushumini yig’ib, o’tgan hafta bilan solishtir.',
          'Kartalardagi sharhlarni kuzat: yomoniga menga javob tayyorla, yaxshisiga o’zing rahmat ayt.',
          'Har kuni ertalab ombor qoldig’ini tekshir va tugayotganini ta’minotchiga eslat.',
        ],
      },
      {
        id: 'retail',
        name: 'Do’konlar tarmog’i',
        cases: [
          'Soat to’qqizgacha — kechagi tushum har bir nuqta bo’yicha, bitta jadvalda.',
          'Haftada bir marta boshqaruvchilardan smena tabelini yig’ib, kassa bilan solishtir.',
          'Yangi nuqta ochilyaptimi — ishga tushirish chek-listini yurit, mas’ullarni muddat bo’yicha turtkilab tur.',
        ],
      },
      {
        id: 'construction',
        name: 'Qurilish firmasi',
        cases: [
          'Har dushanba brigadirlardan obyektlarda qancha ish qilinganini foto bilan yig’ib ol.',
          'Yetkazib berish muddatlarini kuzat. Yetkazib beruvchi kechiktirsa — unga eslat va menga ayt.',
          'Pudratchidan hisob-faktura kelsa, shartnoma bilan solishtir va qayeri to’g’ri kelmasligini ko’rsat.',
        ],
      },
      {
        id: 'clinic',
        name: 'Klinika',
        cases: [
          'Bemorlarga qabuldan bir kun oldin eslat. Tasdiqlamasa — boshqa vaqtga ko’chirishni taklif qil.',
          'Har kuni kechqurun: nechta qabul, nechta bekor qilingan, nechta yangi murojaat.',
          'Saytdan va messenjerlardan kelgan so’rovlarni bazaga kirit, birinchi javobni tayyorla.',
        ],
      },
    ],
  },

  product: {
    label: 'Bu rostdan bor',
    title: 'Quyida rasm emas. Dasturning o’zi',
    copy: 'Bu skrinshot ham, video ham emas: haqiqiy Echelon Desktop — demoda xuddi shuni ko’rasiz. Bo’limlarni aylanib chiqing, vazifani suring, xotirani oching.',
    openLabel: 'Ochish',
    openedLabel: 'Ochiq',
    demoNote: 'Demo ma’lumotlar',
    hint: 'Chapdagi bo’limlar — hammasi jonli',
    tabs: {
      chat: 'Chat',
      graph: 'Xotira',
      vault: 'Ombor',
      kanban: 'Vazifalar',
      automations: 'Avtomatlashtirish',
      analytics: 'Xarajatlar',
    },
    graphAlt:
      'Xotira grafi: 236 ta tugun — siz, biznesingiz, 24 ta odam, 12 ta loyiha, 8 ta mavzu va yozib olingan 150 ta kelishuv, 358 ta bog’lanish bilan ulangan. Yozuvlarning to’liq ro’yxati «Ombor» bo’limida.',
    kanbanHelp:
      'Vazifani sichqoncha bilan suring yoki klaviaturadan ko’chiring: Probel, keyin strelkalar.',
    kanbanGrabbed: 'Vazifa olindi. Strelkalar — ko’chirish, Probel — qo’yish, Escape — bekor qilish.',
    kanbanDropped: 'Vazifa ustunga ko’chirildi',
  },

  client: {
    label: 'U qo’llaydi',
    title: 'Mijoz yozdi',
    incomingLabel: 'Kiruvchi',
    incoming: {
      from: 'Dilshod',
      channel: 'Telegram · 19:12',
      text: 'Assalomu alaykum! Buyurtmaga qilasizmi? Hajmini hisoblab berish kerak.',
    },
    draftLabel: 'Javob tayyorlandi',
    replies: {
      concise: 'Ha, qilamiz. Hajmini yuboring — kechgacha hisoblab beraman.',
      formal:
        'Assalomu alaykum! Ha, biz buyurtmaga ishlaymiz. Iltimos, hajmini yuboring — kechgacha hisob-kitobni tayyorlab qo’yaman.',
      skip: 'Assalomu alaykum! Ha, buyurtmaga qilamiz. Hajmini ayting — kechgacha hisoblab beraman.',
    },
    ruleNoteLabel: '014-qoida',
    ruleNote: 'siz uni yuqorida berdingiz',
    ruleNames: {
      concise: 'qisqa',
      formal: 'rasmiy',
      skip: 'qoida berilmagan — odatdagidek javob beradi',
    },
    sendLabel: 'Faqat «yuborish»ni bosish qoldi',
    followUp: 'Ikki kun jim qolsa — o’zi yozadi.',
  },

  boundary: {
    label: 'U chegarani biladi',
    title: 'Kundalik ishni oxirigacha qiladi. Qarorni sizga qoldiradi',
    tasks: [
      { name: 'Mijozga javob berish', state: 'Bajarildi' },
      { name: 'Obyektlar bo’yicha hisobot yig’ish', state: 'Bajarildi' },
      { name: 'Jim qolganlarga eslatish', state: 'Bajarildi' },
      { name: '№214 hisob-fakturani to’lash', state: 'Sizni kutyapti' },
    ],
    doneLabel: 'Bajarildi',
    gateLabel: 'Egasining qarori',
    gateName: '№214 hisob-fakturani to’lash',
    gateReason: 'Hisob-faktura shartnomadan 340 000 ga farq qiladi — 3-band',
    gateNote: 'Undan nariga o’tmaydi. Bu xatolik emas, bu chegara.',
    approve: 'Tasdiqlash',
    reject: 'Rad etish',
    approved: 'Siz tasdiqladingiz',
    rejected: 'Siz rad etdingiz',
    limitsLabel: 'U nima qilmaydi — so’rasangiz ham',
    limits: [
      'Shartnoma imzolamaydi',
      'Pul o’tkazmaydi',
      'Ishga olmaydi va ishdan bo’shatmaydi',
      'Sizning ovozingiz kerak joyda siz uchun gapirmaydi',
    ],
    honesty:
      'U bitta odamga — egasiga moslangan. Bu kamchilik emas, bu pozitsiya: yordamchining bitta boshlig’i bo’ladi. Va u sehrgar emas: bu sahifadagi hamma narsa — uning har kuni qiladigan ishi, bundan ortig’ini va’da qilmaymiz.',
    setup:
      'Windows, macOS yoki Linux o’rnatilgan oddiy kompyuterga o’rnatiladi va shaxsan sizga — sizning odamlaringiz va tartibingizga moslanadi. O’zi kompyuterda yashaydi, unga esa xohlagan joydan, hatto telefondagi Telegramdan yozsa bo’ladi.',
  },

  night: {
    label: '23:00',
    title: 'Tungi smena',
    copy: 'Qo’lingiz hech tegmaydigan katta vazifa. U ishni bo’laklarga bo’lib, o’zining bir necha nusxasini parallel ishga tushirdi.',
    task: 'Ikki yillik mijozlar bazasini saralash',
    tracks: [
      { name: 'Segmentatsiya', detail: '4 218 ta yozuv' },
      { name: 'Dublikatlar', detail: '1 106 ta moslik' },
      { name: 'Hisobot', detail: 'segmentlar bo’yicha' },
    ],
    running: 'Ishlayapti',
    complete: 'Tayyor',
    resultLabel: 'Ertalabga',
    result: 'Hisobot tayyor',
    costLabel: 'Sarflandi',
    cost: '$1.14',
    costNote: 'Narx taxmin bo’yicha emas, haqiqiy billing bo’yicha.',
  },

  voice: {
    label: 'Shunchaki gaplashing',
    title: 'Shu yerda Jarvis taqqoslash bo’lishdan to’xtaydi',
    copy: 'Mashinada ketyapsiz, yangi nuqta haqida o’ylayapsiz — va u bilan odamdek ovoz chiqarib gaplashasiz. U ovozda javob beradi, butun biznesingizni yodida tutadi va martdagi muzokara nima bilan tugaganini biladi. Oxirida «shug’ullan» desangiz — borib qiladi.',
    playRecording: 'Tinglash',
    stopRecording: 'To’xtatish',
    talkButton: 'Gaplashish',
    stopButton: 'Tugatish',
    listening: 'Eshityapti',
    thinking: 'O’ylayapti',
    speaking: 'Gapiryapti',
    connecting: 'Ulanyapti',
    idle: 'Jimlik',
    unavailable: 'Suhbat yozuvi:',
    micDenied: 'Mikrofonga ruxsat kerak',
    error: 'Ulanib bo’lmadi. Keyinroq urinib ko’ring.',
    transcriptLabel: 'Yozuv matni',
    speakers: { you: 'Siz', echelon: 'Echelon' },
    transcript: [
      { who: 'you' as const, text: 'Yangi nuqta bo’yicha ahvol qanday?' },
      {
        who: 'echelon' as const,
        text: '18 tadan 12 tasi yopildi. Santexnika kechikyapti. Aziz bugun javob beraman dedi.',
        marks: ['Yangi nuqta', 'Aziz'],
      },
      { who: 'you' as const, text: 'Kechqurun unga eslat.' },
      { who: 'echelon' as const, text: '18:30ga qo’ydim. Javob bersa, aytaman.', marks: [] },
    ],
    marksNote: 'Tagi chizilganini u shu suhbatdan emas, xotirangizdan biladi.',
    coreLabel: 'Shu paytda xotirasida',
    coreEntities: [
      { label: 'Aziz', kind: 'santexnika' },
      { label: 'Yangi nuqta', kind: 'obyekt' },
      { label: 'Alisher', kind: 'yetkazib beruvchi' },
      { label: 'Timur', kind: 'brigadir' },
      { label: 'Hisobot qoidasi', kind: 'qoida' },
    ],
  },

  ledger: {
    label: 'Odam hisobida sanang',
    title: 'To’g’ri taqqos — dastur bilan emas, shtatdagi odam bilan',
    humanCol: 'Shtatdagi yordamchi',
    echelonCol: 'Echelon Desktop',
    yes: 'ha',
    no: 'yo’q',
    rows: [
      { label: 'Har oy — maosh', human: 'ha', echelon: 'yo’q' },
      { label: 'Uxlaydi, kasal bo’ladi, ta’tilga chiqadi', human: 'ha', echelon: 'yo’q' },
      { label: 'Ishdan bo’shab, yodidagini olib ketadi', human: 'ha', echelon: 'yo’q' },
      { label: 'Har bir kelishuvni so’zma-so’z eslaydi', human: 'yo’q', echelon: 'ha' },
      { label: 'Kechasi va dam olish kunlari ishlaydi', human: 'yo’q', echelon: 'ha' },
    ],
    caption: 'Shtatdagi yordamchi va Echelon Desktop beshta belgi bo’yicha taqqoslangan',
    bottom: 'Aniq raqamni demoda aytamiz. U yana bitta odamning maoshidan sezilarli arzon.',
  },

  handover: {
    label: 'Smenani topshirish',
    title: 'Biznes sizni kutishdan to’xtagan kun mana shunday ko’rinadi',
    sessionLabel: 'Sessiya',
    lines: {
      rule: 'Siz qoida berdingiz',
      facts: 'U eslab qoldi',
      automations: 'Avtomatlashtirildi',
      actions: 'Bajarilgan harakatlar',
      escalations: 'Sizga topshirildi',
    },
    /* O‘zbekchada sondan keyin ko‘plik qo‘shimchasi qo‘yilmaydi. */
    units: {
      rule: ['qoida', 'qoida', 'qoida'],
      facts: ['yozuv', 'yozuv', 'yozuv'],
      automations: ['jarayon', 'jarayon', 'jarayon'],
      actions: ['harakat', 'harakat', 'harakat'],
      escalations: ['qaror', 'qaror', 'qaror'],
    },
    ruleLearnedLabel: 'O’rganilgan qoida',
    emptyNote: 'Siz shunchaki ko’rib chiqdingiz — u qanday ishlashini bilish uchun shuning o’zi yetarli.',
    closing:
      'Yuqoridagilarning hammasini u har kuni qiladi. Farqi shundaki, bu sizning biznesingiz, sizning odamlaringiz va sizning kelishuvlaringiz bo’ladi.',
    cta: 'ECHELONga biznesimni ko’rsatish',
    ctaState: 'Telegram ochilyapti',
    note: '@komrxn · Telegram · yarim soat, hech narsa o’rnatish shart emas',
  },

  tape: {
    label: 'Ish tasmasi',
    ariaLabel: 'Echelon smena davomida nima qildi',
    events: [
      { time: '08:57', code: 'KIRUVCHI', text: '+3' },
      { time: '09:00', code: 'SVODKA', text: 'tayyor' },
      { time: '10:04', code: 'YUBORILDI', text: '4 ta xabar' },
      { time: '12:00', code: 'ESLATMA', text: 'Temurga' },
      { time: '19:04', code: 'HISOBOT', text: 'tayyor' },
      { time: '19:16', code: 'SO’ROV', text: 'Dilshod' },
      { time: '19:40', code: 'QAROR', text: 'egasiga' },
      { time: '23:00', code: 'TUNGI SMENA', text: 'boshlandi' },
    ],
  },

  cursor: {
    view: 'Ko’rish',
    open: 'Ochish',
    run: 'Ishga tushirish',
    hold: 'Sizni kutyapti',
    drag: 'Surish',
    speak: 'Tinglash',
    stop: 'To’xtatish',
    return: 'Orqaga',
    approve: 'Hal qilish',
  },

  footer: {
    product: 'Echelon Desktop',
    line: 'Biznes egasining shaxsiy yordamchisi. Kompyuteringizda yashaydi.',
    demoNote: 'Bu sahifadagi misollardagi ma’lumotlar — namoyish uchun.',
    rights: '© 2026 Echelon Desktop',
  },

  ui: {
    appTitle: 'Echelon Desktop',
    nav: {
      daily: 'Har kuni',
      chat: 'Chat',
      home: 'Bosh sahifa',
      memory: 'Xotira',
      graph: 'Graf',
      vault: 'Ombor',
      sessions: 'Sessiyalar',
      operate: 'Boshqaruv',
      kanban: 'Smart Kanban',
      automations: 'Avtomatlashtirish',
      skills: 'Ko’nikmalar',
      computer: 'Kompyuter',
      channels: 'Kanallar',
      connections: 'Ulanishlar',
      brain: 'Miya',
      models: 'Modellar',
      analytics: 'Analitika',
    },
    chat: {
      composer: 'Echelon Desktop uchun xabar…',
      briefingTag: 'o’zi',
      briefingKind: 'Svodka',
      briefingTitle: 'Ertalabki svodka — 3 ta band',
      briefingBody:
        'Yetkazib beruvchi jo’natishni tasdiqladi · tunda 2 ta yangi so’rov · №214 hisob-faktura qaroringizni kutyapti',
      briefingTime: '09:00',
      discuss: 'Muhokama qilish',
      userMsg: 'Brigadirlardan obyektlarda qancha ish qilinganini so’rab, jadval yubor.',
      working: 'Ishlayapman…',
      toolsDone: 'Vositalar: 4',
      reply:
        'Bajarildi. Uchtasiga Telegramda, Rustamga WhatsAppda yozdim. Ikkitasi darrov javob berdi, Temur jim — 12:00da eslataman. Jadval 13:00gacha tayyor bo’ladi.',
      replyMeta: '10:41 · $0.04',
      chips: [
        {
          q: 'Telegramdagi so’rov nima bo’ldi?',
          a: 'Dilshodning so’rovi ishda, holati «birinchi aloqa». Javob sizning so’zlaringiz bilan tayyorlandi — yuboraymi?',
        },
        {
          q: 'Bugun qancha sarfladik?',
          a: 'Bugungi ishim $0.62 turdi: svodka, 14 ta xabar, obyektlar bo’yicha hisobot. Kunlik limit $5, 12% ishlatildi.',
        },
        {
          q: 'Alisher bilan nimaga kelishgandik?',
          a: 'Martda: 14 kun muddat, 50 blokdan yuqorisiga yetkazish uning hisobidan. 12-mart yozishmasidan olingan.',
        },
      ],
    },
    kanban: {
      columns: ['Ishda', 'Bloklangan', 'Tekshiruv', 'Tayyor'],
      cards: {
        running: ['Uchta qadoq yetkazib beruvchidan narx yig’ish', 'Hafta sharhlariga javoblar'],
        blocked: ['Pudratchi hisob-fakturasini solishtirish — hujjat kutilyapti'],
        review: ['Kanalga post: yangi menyu'],
        done: ['Kechagi tushum hisoboti'],
      },
      meta: {
        running: ['4 qadam · 1 k', '2 qadam · 3 s'],
        blocked: ['2 k'],
        review: ['5 s'],
        done: ['kecha'],
      },
      moveLabel: 'Vazifani ko’chirish',
    },
    automations: {
      title: 'Avtomatlashtirish',
      rows: [
        { name: 'Ertalabki svodka', schedule: 'har kuni, 09:00', active: true },
        { name: 'Nuqtalar bo’yicha kechki raqamlar', schedule: 'har kuni, 19:00', active: true },
        { name: 'Brigadirlar hisoboti', schedule: 'dushanba, 10:00', active: true },
        { name: 'To’xtab qolgan vazifalar — eslatish', schedule: 'har kuni, 10:00', active: true },
      ],
      active: 'ishlayapti',
      paused: 'pauzada',
      toggleLabel: 'Yoqish yoki pauzaga qo’yish',
    },
    graph: {
      stats: 'tugun: {n} · bog’lanish: {e}',
      legend: {
        owner: 'Siz',
        people: 'Odamlar',
        projects: 'Loyihalar',
        memories: 'Kelishuvlar',
        themes: 'Mavzular',
      },
      hint: 'G’ildirak — masshtab · fonni torting · tugunni bosing',
      card: {
        links: 'bog’lanish',
        close: 'Yopish',
        types: {
          owner: 'Siz',
          job: 'Biznes',
          person: 'Odam',
          project: 'Loyiha',
          memory: 'Kelishuv',
          theme: 'Mavzu',
          thought: 'Eslatma',
        },
      },
      data: {
        job: 'Sizning biznesingiz',
        people: [
          'Alisher · yetkazib beruvchi', 'Dilshod · mijoz', 'Temur · brigadir', 'Rustam · brigadir',
          'Zarina · buxgalter', 'Otabek · boshqaruvchi', 'Jasur · prorab', 'Nodira · menejer',
          'Sanjar · yetkazib beruvchi', 'Bekzod · haydovchi', 'Umid · mijoz', 'Gulnora · kassir',
          'Farrux · hamkor', 'Aziz · ta’minotchi', 'Shahnoza · menejer', 'Komil · mijoz',
          'Madina · buxgalter', 'Ikrom · pudratchi', 'Sevara · administrator', 'Bahodir · yetkazib beruvchi',
          'Lola · mijoz', 'Sherzod · brigadir', 'Diyora · menejer', 'Ulug’bek · hamkor',
        ],
        projects: [
          'Chilonzor obyekti', 'Yunusobod obyekti', 'Yangi nuqta', 'Kabel yetkazish',
          'Ombor ta’miri', 'Pardozlash tenderi', 'Qadoq xaridi', 'Kompaniya sayti',
          'Ofis ko’chishi', 'Ijara shartnomasi', 'Sertifikatlash', 'Smenaga odam olish',
        ],
        themes: ['Yetkazib berish', 'Narxlar', 'Xodimlar', 'Mijozlar', 'Ombor', 'Hisobotlar', 'Ijara', 'Reklama'],
        memoryTemplates: [
          '14 kun muddat — {p}',
          '50 blokdan chegirma — {p}',
          'Yetkazilgach to’lov — {p}',
          'Yetkazish uning hisobidan — {p}',
          'Dushanbalarda obyekt fotosi — {p}',
          '20:00dan keyin qo’ng’iroq qilmaslik — {p}',
          '30% oldindan to’lov — {p}',
          'Hisobni shartnoma bilan solishtirish — {p}',
          'Hisobot 19:00gacha — {p}',
          'O’zbekcha yozish — {p}',
        ],
        thoughtTemplates: [
          '{t} bo’yicha narxlarni tekshirish',
          'Planyorkada {t}ni muhokama qilish',
          '{t} bo’yicha xavf',
          'Fikr: {t}ni avtomatlashtirish',
        ],
      },
    },
    vault: {
      searchNote: 'Qatorni bosing — yozuv ochiladi',
      filters: {
        all: 'Hammasi',
        person: 'Odamlar',
        project: 'Loyihalar',
        memory: 'Kelishuvlar',
        theme: 'Mavzular',
      },
      cols: { label: 'Nomi', type: 'Turi', summary: 'Qisqacha', updated: 'Yangilandi' },
      close: 'Yopish',
      rows: [
        { label: 'alisher', type: 'person', summary: 'Blok yetkazib beruvchi · 14 kun muddat, yetkazish o’zidan', updated: '2 soat oldin' },
        { label: 'dilshod', type: 'person', summary: 'Mijoz · buyurtmaga, kechga raqam kutyapti', updated: 'bugun' },
        { label: 'zarina', type: 'person', summary: 'Buxgalter · ekvayringni 20:00gacha yuboradi', updated: 'kecha' },
        { label: 'chilonzor obyekti', type: 'project', summary: 'Suvoq 80% · elektrika kabel kutyapti', updated: '3 soat oldin' },
        { label: 'yangi nuqta', type: 'project', summary: 'Ishga tushirish chek-listi · 18 tadan 12 tasi yopilgan', updated: 'kecha' },
        { label: 'alisher muddati', type: 'memory', summary: '12-martdan 14 kun · yozishmadan olingan', updated: 'mart' },
        { label: 'hisobot qoidasi', type: 'memory', summary: 'Brigadirlar — dushanba 10:00, foto bilan', updated: 'iyul' },
        { label: 'mijozlar uchun ohang', type: 'memory', summary: 'Qisqa, rasmiyatchiliksiz, hurmat bilan', updated: 'iyun' },
        { label: 'yetkazib berish', type: 'theme', summary: '3 ta yetkazib beruvchi · har biriga grafik va narx', updated: 'bugun' },
        { label: 'xodimlar', type: 'theme', summary: 'Smenalar, tabel, ikkita ochiq o’rin', updated: 'kecha' },
      ],
    },
    analytics: {
      kpis: [
        { label: 'Bugun', value: '$0.62' },
        { label: 'Hafta bo’yicha', value: '$4.18' },
        { label: 'Bugungi javoblar', value: '27' },
      ],
      days: ['dsh', 'ses', 'chor', 'pay', 'jum', 'shan', 'yak'],
      values: [0.54, 0.71, 0.48, 0.66, 0.62, 0.31, 0.24],
      note: 'Narx taxmin bo’yicha emas, haqiqiy billing bo’yicha. Kunlik limit $5.',
      chartLabel: 'Hafta kunlari bo’yicha xarajat, dollarda',
    },
  },
};

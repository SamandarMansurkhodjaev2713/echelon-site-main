import type { Dict } from './ru';

export const uz: Dict = {
  meta: {
    title: 'Echelon Desktop — butun biznesingizni yodida tutadigan yordamchi',
    description:
      'Biznes egasining shaxsiy yordamchisi. Kompyuteringizda ishlaydi, odamlar-u kelishuvlarni eslab qoladi, hisobotlarni o’zi yig’adi, mijozlarga javob beradi va kechasi ham ishlaydi. Demoni o’z biznesingiz misolida ko’ring.',
  },
  nav: {
    cta: 'Demo ko’rish',
  },
  hero: {
    h1: 'Butun biznesingizni yodida tutadi.\nIshni o’zi bajaradi.\nUxlamaydi.',
    sub:
      'Echelon Desktop — biznes egasining shaxsiy yordamchisi. Toni Starkning Jarvisi esingizdami? G’oya o’sha. Faqat Jarvis — kino, bu esa sizning kompyuteringizda ishlaydi va quyida ko’rsatilgan ishlarni aynan bajaradi. U uxlamaydi, unutmaydi va ishdan bo’shab ketmaydi.',
    cta: 'Demoni o’z biznesingiz misolida ko’ring',
    ctaNote: 'Jonli suhbat, 30 daqiqa. Hech narsa o’rnatish shart emas.',
    proof:
      'Mahsulotga bir yil bo’ldi. Har kuni muallifning biznesini yuritadi — va birinchi to’lovchi mijozda ham ishlab turibdi.',
  },
  before: {
    eyebrow: 'Sizning oddiy kuningiz',
    title: 'Tanish holatmi?',
    beats: [
      'Odamlar sizga beshta turli chatda yozadi — va har birida javob kutishadi.',
      'Kunlik raqamlar faqat o’zingiz eslatsangizgina yig’iladi.',
      'Kelishuvlarning yarmi boshingizda turadi. Sizsiz hech narsa siljimaydi.',
    ],
    chaosMessages: [
      { from: 'Buxgalter', text: 'Kechqurun tashlab beraman, ulgurmayapman' },
      { from: 'Boshqaruvchi', text: 'Yetkazib beruvchi bilan nima deb kelishgandik o’zi?' },
      { from: 'Mijoz', text: 'Assalomu alaykum, buyurtma bo’yicha javob berasizmi?' },
      { from: 'Prorab', text: 'Obyektdan olingan fotolarni qayerga yuboray?' },
      { from: 'Hamkor', text: 'Buni mart oyida gaplashgandik-ku' },
      { from: 'Menejer', text: 'Narxlar bo’yicha nima qaror qilgandik, eslatib yuborasizmi?' },
    ],
  },
  day: {
    eyebrow: 'O’sha kunning o’zi',
    title: 'Echelon Desktop bilan bir kun',
    intro: 'Pastga suring. Soat yuryapti — u ishlayapti.',
    scenes: [
      {
        time: '09:00',
        title: 'Svodka allaqachon tayyor',
        text:
          'Siz uxlab yotganingizda u pochta va chatlarni saralab chiqdi. Nima bo’ldi, nima to’xtab qoldi, kim javobingizni kutyapti — yigirmata bildirishnoma emas, bitta sahifa. U allaqachon Telegramingizda kutib turibdi.',
        fragment: {
          kind: 'briefing',
          tag: 'o’zi',
          label: 'Svodka',
          title: 'Ertalabki svodka',
          lines: [
            'Yetkazib beruvchi payshanbaga jo’natishni tasdiqladi',
            'Kechasi 2 ta yangi so’rov tushdi — ikkalasi allaqachon ishda',
            '214-hisob shartnomaga to’g’ri kelmayapti — 3-bandga qarang',
          ],
        },
      },
      {
        time: '10:00',
        title: 'Hisobotlar sizsiz yig’ildi',
        text:
          'U har bir ijrochiga o’zi yozdi — har kimning o’z messenjerida. Javoblarni yig’di. Jim qolganlarga yana bir bor eslatdi. Sizga — umumiy manzara: nima bajarildi, nima yo’q, kim orqada qolyapti.',
        fragment: {
          kind: 'messenger',
          out: 'Xayrli tong! Chilonzor bo’yicha bugungi holat qanday?',
          in1: 'Shtukaturka 80%, ertaga yopamiz',
          in2: 'Elektrika to’xtab qoldi — kabel yo’q',
          note: 'Timur jim — 12:00da eslatib qo’yaman',
        },
      },
      {
        time: '14:00',
        title: 'Mijoz sovib ulgurmadi',
        text:
          'Siz band paytingizda bir odam Telegramda yozib qoldirdi. U allaqachon so’rovlar ro’yxatida, javob sizning so’zlaringiz bilan tayyorlab qo’yilgan. Ikki kun jim qolsa — Echelon o’zi unga yozadi.',
        fragment: {
          kind: 'lead',
          name: 'Dilshod',
          source: 'Telegram · 13:52',
          stage: 'Birinchi kontakt',
          draft:
            'Assalomu alaykum! Ha, buyurtma asosida qilamiz. Hajmini ayting — kechgacha hisoblab beraman.',
          draftLabel: 'Javob sizning so’zlaringiz bilan — faqat «yuborish»ni bosish qoldi',
        },
      },
      {
        time: '19:00',
        title: 'Kunlik raqamlar jamlangan',
        text:
          'Buxgalterda bir raqam, boshqaruvchida boshqasi, kassada uchinchisi. U hammani aylanib chiqdi, ma’lumotlarni oldi, yetishmaganini qayta so’radi. Sizga o’nta xabar emas, tayyor hisobot keldi.',
        fragment: {
          kind: 'report',
          title: 'Kunlik raqamlar',
          rows: [
            { label: 'Kassa, zal', value: '4 120 000' },
            { label: 'Dostavka', value: '1 890 000' },
            { label: 'Naqdsiz', value: '2 240 000' },
          ],
          note: 'Zarina ekvayringni yubormadi — qayta so’radim, 20:00gacha qo’shaman',
        },
      },
      {
        time: '23:00',
        title: 'Tungi smena',
        text:
          'Sizda hech qachon butun boshli kun topilmaydigan katta vazifa: u ishni bo’laklarga bo’lib, o’zining bir nechta nusxasini parallel ishga soldi. Ertalab — natija va bunga aniq qancha ketgani.',
        fragment: {
          kind: 'night',
          task: 'Ikki yillik mijozlar bazasini saralash',
          workers: ['Segmentatsiya — ishlayapti', 'Dublikatlar — ishlayapti', 'Hisobot — navbatda'],
          cost: 'sarflandi: $1.14',
        },
      },
    ],
  },
  touch: {
    eyebrow: 'Bu haqiqatan bor',
    title: 'Ushlab ko’ring',
    intro:
      'Bular skrinshot ham, video ham emas. Quyida — Echelon Desktopning jonli interfeysi, demoda xuddi shuni ko’rasiz. Bosib ko’ring.',
    demoNote: 'Demo ma’lumotlar',
    tabs: {
      chat: 'Chat',
      graph: 'Xotira',
      kanban: 'Vazifalar',
      automations: 'Avtomatlashtirish',
    },
  },
  words: {
    eyebrow: 'Eng muhimi',
    title: 'So’z bilan ayting — odatga aylanadi',
    lead: 'Hech qanday sozlash-u konstruktor yo’q. Odamga qanday aytsangiz, shunday gapirasiz:',
    instruction:
      'Har dushanba ertalab soat 10da brigadirlardan obyektlar bo’yicha qancha ish qilinganini yig’ib, menga jadval qilib yubor.',
    result: 'Tamom. Endi bu har hafta ishlaydi.',
    correction:
      '«Soat sakkizda yubor, obyekt fotolarini ham qo’sh» — va keyingi dushanbadan shunday bo’ladi.',
    explain:
      'Oddiy dastur faqat dasturchi oldindan ko’zda tutgan ishlarni qila oladi. Bu yerda esa u nimalarni bilishini o’zingiz hal qilasiz — o’z so’zlaringiz bilan. Shaurmaxona bilan qurilish firmasida butunlay boshqa-boshqa yordamchi shakllanadi — va ularni hech kim oldindan o’ylab qo’ymagan.',
    switcherLabel: 'O’z biznesingiz misolida ko’ring:',
    businesses: [
      {
        id: 'restaurant',
        name: 'Restoran',
        cases: [
          'Har kuni kechqurun kassa, zal va dostavka bo’yicha tushumni yig’ib, o’tgan hafta bilan solishtir.',
          'Kartalardagi sharhlarni kuzatib bor. Yomonlariga menga javob tayyorla, yaxshilariga o’zing rahmat ayt.',
          'Har kuni ertalab ombor qoldiqlarini tekshir va tugab borayotganini ta’minotchiga eslat.',
        ],
      },
      {
        id: 'retail',
        name: 'Do’konlar tarmog’i',
        cases: [
          'Ertalab to’qqizgacha — har bir nuqtaning kechagi tushumi, bitta jadvalda.',
          'Haftada bir marta boshqaruvchilardan smenalar tabelini yig’ib, kassa bilan solishtir.',
          'Yangi nuqta ochilyaptimi — ishga tushirish chek-listini yurit, muddatlar bo’yicha mas’ullarni turtkilab tur.',
        ],
      },
      {
        id: 'construction',
        name: 'Qurilish firmasi',
        cases: [
          'Har dushanba brigadirlardan obyektlar bo’yicha qancha ish qilinganini foto bilan yig’ib ol.',
          'Yetkazib berish muddatlarini kuzat. Yetkazib beruvchi kechiktirsa — unga eslat va menga ayt.',
          'Pudratchidan hisob keldimi — shartnoma bilan solishtir va farqlarini ko’rsat.',
        ],
      },
      {
        id: 'clinic',
        name: 'Klinika',
        cases: [
          'Bemorlarga qabul haqida bir kun oldin eslat — tasdiqlamasa, boshqa kunga ko’chirishni taklif qil.',
          'Har kuni kechqurun — nechta qabul, nechta bekor qilingan, nechta yangi murojaat.',
          'Saytdan va messenjerlardan kelgan so’rovlarni bazaga kirit, birinchi javobni tayyorlab qo’y.',
        ],
      },
    ],
  },
  pillars: {
    eyebrow: 'Bu nimaga tayanadi',
    title: 'Nega bu ishlaydi — beshta sabab',
    items: [
      {
        name: 'Eslab qoladi',
        text:
          'Kim kimligini, kim nima va’da berganini, martda nima kelishilganini biladi. Xotira oyna yopilganda o’chmaydi, yangi chatda nolga tushmaydi — va u sizniki.',
      },
      {
        name: 'Bajaradi',
        text:
          'Maslahat bermaydi — bajaradi: odamlarga yozadi, ma’lumot yig’adi, hisobot jo’natadi, CRMga kiritadi. Sizga faqat tekshirish qoladi — o’zingiz qilish emas.',
      },
      {
        name: 'O’rganadi',
        text:
          'Bir marta tuzatdingiz — «mijozlarga qisqaroq yoz» — va bu abadiy uning ish qoidasiga aylanadi. Bir oydan keyin u aynan sizga kerak bo’lganday ishlaydi.',
      },
      {
        name: 'Uxlamaydi',
        text:
          '9:00da svodka tayyor turadi. Kechasi u kunduzi qo’lingiz tegmaydigan ishlarni qiladi. Jadvalni o’zi eslab yuradi — eslatish shart emas.',
      },
      {
        name: 'Sizniki',
        text:
          'Sizning kompyuteringizda yashaydi. Xotira, yozishmalar va raqamlar birovning bulutida emas, o’zingizda qoladi. U ishdan bo’shab, ularni olib keta olmaydi.',
      },
    ],
  },
  voice: {
    eyebrow: 'Shunchaki gaplashish',
    title: 'Shu yerda Jarvis metafora bo’lmay qoladi',
    text:
      'Mashinada ketyapsiz, yangi nuqta haqida o’ylayapsiz — va u bilan xuddi odam bilan gaplashganday ovoz chiqarib gaplashasiz. U ovoz bilan javob beradi, butun biznesingizni yodida tutadi va martdagi muzokaralar nima bilan tugaganini biladi. Oxirida «shu bilan shug’ullan» deysiz — u ishga kirishadi.',
    sphereHint: 'Quyidagi sfera — jonli. Bosing va undan Echelon haqida ovoz bilan so’rang.',
    talkButton: 'Gaplashish',
    stopButton: 'Tugatish',
    listening: 'Eshityapti…',
    thinking: 'O’ylayapti…',
    speaking: 'Gapiryapti',
    connecting: 'Ulanyapti…',
    unavailable: 'Uning qanday gapirishini eshitib ko’ring:',
    playRecording: 'Yozuvni qo’yish',
    micDenied: 'Mikrofonga ruxsat kerak',
    error: 'Ulanib bo’lmadi. Keyinroq urinib ko’ring.',
  },
  honesty: {
    eyebrow: 'Ertak aytmaymiz',
    title: 'U nimalarni qilmaydi',
    paragraphs: [
      'U siz uchun qaror qabul qilmaydi. Shartnoma imzolamaydi, pul o’tkazmaydi, ishga olmaydi va ishdan bo’shatmaydi. Topshirilgan kundalik ishni o’zi bajaradi, qarorlarni esa tayyorlab beradi — qabul qilish sizniki.',
      'U bitta odamga — egasiga moslab sozlangan. Bu cheklov emas, bu pozitsiya: yordamchining bitta xo’jayini bo’ladi.',
      'U sehrli emas. Bu sahifada ko’rsatilganlarning bari — u har kuni qiladigan ishlar. Bundan ortig’ini va’da qilmaymiz.',
    ],
    setup:
      'Echelon Desktop oddiy kompyuterga o’rnatiladi — Windows, macOS yoki Linux — va shaxsan sizga moslab sozlanadi: sizning biznesingiz, sizning odamlaringiz, sizning qoidalaringiz. O’zi kompyuterda ishlaydi, unga esa istalgan joydan yozasiz — hatto telefondagi Telegramdan ham.',
  },
  math: {
    eyebrow: 'Odam hisobida sanang',
    title: 'Yordamchi qancha turadi?',
    rows: [
      { label: 'Har oy — oylik maosh', human: 'ha', echelon: 'yo’q' },
      { label: 'Uxlaydi, kasal bo’ladi, ta’tilga chiqadi', human: 'ha', echelon: 'yo’q' },
      { label: 'Ishdan bo’shaydi — eslab yurganining hammasini olib ketadi', human: 'ha', echelon: 'yo’q' },
      { label: 'Har bir kelishuvni so’zma-so’z eslab qoladi', human: 'yo’q', echelon: 'ha' },
      { label: 'Kechasi va dam olish kunlari ishlaydi', human: 'yo’q', echelon: 'ha' },
    ],
    humanCol: 'Shtatdagi yordamchi',
    echelonCol: 'Echelon Desktop',
    bottom:
      'Aniq raqamni demoda eshitasiz. U shtatga yana bitta odam olishdan arzon — sezilarli darajada.',
  },
  finalCta: {
    title: 'Biznesingiz bo’yicha hisobotni qanday yig’ishini ko’ring',
    text:
      'Telegramda yozing — jonli demo vaqtini kelishamiz. Yarim soat, hech narsa o’rnatilmaydi: siz shunchaki o’z ishingizdan olingan misollarda bu qanday ishlashini ko’rasiz.',
    button: 'Telegramda yozish',
    note: '@komrxn · mahsulot egasi o’zi javob beradi',
  },
  footer: {
    product: 'Echelon Desktop',
    line: 'Biznes egasining shaxsiy yordamchisi. Sizning kompyuteringizda ishlaydi.',
    demoNote: 'Bu sahifadagi misollarda keltirilgan barcha ma’lumotlar — namoyish uchun.',
    rights: '© 2026 Echelon Desktop',
  },
  ui: {
    appTitle: 'Echelon Desktop',
    nav: {
      daily: 'Kundalik',
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
      analytics: 'Statistika',
    },
    chat: {
      composer: 'Echelon Desktopga xabar…',
      briefingTag: 'o’zi',
      briefingKind: 'Svodka',
      briefingTitle: 'Ertalabki svodka — 3 band',
      briefingBody:
        'Yetkazib beruvchi jo’natishni tasdiqladi · kechasi 2 ta yangi so’rov · 214-hisob qaroringizni kutyapti',
      briefingTime: '09:00',
      discuss: 'Muhokama qilish',
      userMsg: 'Brigadirlardan obyektlar bo’yicha qancha ish qilinganini yig’ib, jadval qilib yubor.',
      working: 'Ishlayapman…',
      toolsDone: '4 ta vosita',
      reply:
        'Tayyor. Uch kishiga Telegramda yozdim, Rustamga — WhatsAppda. Ikkitasi darrov javob berdi, Timurdan darak yo’q — 12:00da eslataman. Jadval 13:00gacha tayyor bo’ladi.',
      replyMeta: '10:41 · $0.04',
      chips: [
        {
          q: 'Telegramdagi so’rov nima bo’ldi?',
          a: 'Dilshodning so’rovi ishda, holati — «birinchi kontakt». Javob sizning so’zlaringiz bilan tayyor — yuboraymi?',
        },
        {
          q: 'Bugun qancha sarfladik?',
          a: 'Bugungi ishim $0.62 turdi: svodka, 14 ta xabar, obyektlar bo’yicha hisobot. Kunlik limit — $5, sarflandi — 12%.',
        },
        {
          q: 'Alisher bilan nima kelishganimizni eslat',
          a: 'Martda: 14 kun kechiktirib to’lash, 50 blokdan boshlab yetkazish uning hisobidan. 12-martdagi yozishmadan yozib olingan.',
        },
      ],
    },
    kanban: {
      columns: ['Jarayonda', 'Kutmoqda', 'Tekshiruv', 'Tayyor'],
      cards: {
        running: ['Uchta qadoq yetkazib beruvchisining narxlarini yig’ish', 'Haftalik sharhlarga javoblar'],
        blocked: ['Pudratchi hisobini solishtirish — hujjat kutilyapti'],
        review: ['Kanalga post: yangi menyu'],
        done: ['Kechagi tushum bo’yicha hisobot'],
      },
    },
    automations: {
      title: 'Avtomatlashtirish',
      rows: [
        { name: 'Ertalabki svodka', schedule: 'har kuni, 09:00', active: true },
        { name: 'Nuqtalar bo’yicha kechki raqamlar', schedule: 'har kuni, 19:00', active: true },
        { name: 'Brigadirlar hisobotlari', schedule: 'dushanba, 10:00', active: true },
        { name: 'To’xtab qolgan vazifalar — eslatish', schedule: 'har kuni, 10:00', active: true },
      ],
      active: 'ishlayapti',
    },
    graph: {
      stats: 'tugunlar: 299 · bog’lanishlar: 632',
      legend: {
        owner: 'Siz',
        people: 'Odamlar',
        projects: 'Loyihalar',
        memories: 'Kelishuvlar',
        themes: 'Mavzular',
      },
    },
  },
};

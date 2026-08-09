import type { Dict } from './ru';

export const uz: Dict = {
  meta: {
    title: 'Echelon Desktop — butun biznesingizni yodida tutadigan shaxsiy yordamchi',
    description:
      'Biznes egasining shaxsiy yordamchisi. Kompyuteringizda ishlaydi, odamlar-u kelishuvlarni eslab qoladi, hisobotlarni o’zi yig’adi, mijozlarga javob beradi va kechasi ham ishlaydi. Demoni o’z biznesingiz misolida ko’ring.',
  },
  nav: {
    cta: 'Demo ko’rish',
  },
  hero: {
    h1: 'Butun biznesni boshingizda\nko’tarib yurishni bas qiling.',
    sub:
      'Echelon Desktop — biznes egasining shaxsiy yordamchisi: odamlaringiz bilan kelishuvlaringizni yodida tutadi, kundalik ishni o’zi bajaradi. Toni Starkning Jarvisi esingizdami? G’oya o’sha. Faqat Jarvis — kino, bu esa kompyuteringizda yashaydi va pastda ko’rsatilganlarni aynan qiladi.',
    cta: 'Demoni o’z biznesingizda ko’ring',
    ctaNote: 'Jonli suhbat, 30 daqiqa, hech narsa o’rnatish shart emas.',
    proof: '2026-yil aprelida o’ylab topilgan. Iyuldan beri birinchi to’lovchi mijozda har kuni ishlab turibdi.',
  },
  before: {
    eyebrow: 'Sizning oddiy kuningiz',
    title: 'Biznes xotirangizga suyanib turibdi',
    beats: [
      'Odamlar beshta chatdan yozadi. Javobni hammasi sizdan kutadi.',
      'Kunlik raqamlarni so’ramaguningizcha hech kim yubormaydi.',
      'Kelishuvlarning yarmi faqat boshingizda: bir hafta yo’q bo’lsangiz — ish to’xtaydi.',
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
    title: 'Bu kunda siz dispetcher emas, egasiz',
    intro: 'Pastga suring. Soat yuryapti — u ishlayapti.',
    scenes: [
      {
        time: '09:00',
        title: 'Svodka allaqachon tayyor',
        text:
          'Siz uxlab yotganingizda u pochta bilan chatlarni saralab chiqdi. Nima bo’ldi, qayerda to’xtab qoldi, kim javobingizni kutyapti — yigirmata bildirishnoma o’rniga bitta sahifa. 9:00gacha u Telegramingizda, birinchi qo’ng’iroqdan oldin.',
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
        title: 'Hisobotni siz emas, u yig’di',
        text:
          'Har bir ijrochiga o’zi yozdi — har kimga o’zining messenjerida. Javob bermaganga qayta eslatdi. Sizga umumiy manzara keldi: nima qilindi, kim orqada qolyapti.',
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
        title: 'Mijoz sovib qolmadi',
        text:
          'Siz band paytingizda odam Telegramga yozdi. Echelon uni so’rovlar ro’yxatiga kiritdi, javobni sizning so’zlaringiz bilan tayyorlab qo’ydi. Mijoz ikki kun jim qolsa — o’zi yozadi.',
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
        title: 'Kun raqamlari bir joyga tushdi',
        text:
          'Buxgalterda bir raqam, kassada boshqasi. U hammani aylanib chiqdi, yetishmagan joyini qayta so’radi. Sizga o’nta xabar emas, bitta tayyor hisobot keldi.',
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
          'Qo’lingiz sira yetmay yurgan katta ish. U ishni bo’laklarga bo’ldi-da, o’zining bir necha nusxasini parallel ishga soldi. Ertalabgacha natija tayyor. Qancha ketgani ham yonida — aniq raqamda.',
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
    eyebrow: 'Bu rostdan bor',
    title: 'Pastdagi interfeys — dasturning o’zi',
    intro:
      'Bu skrinshot ham, video ham emas — jonli Echelon Desktop. Demoda xuddi shuni ko’rasiz. Bosib ko’ring.',
    demoNote: 'Demo ma’lumotlar',
    tabs: {
      chat: 'Chat',
      graph: 'Xotira',
      vault: 'Ombor',
      kanban: 'Vazifalar',
      automations: 'Avtomatlashtirish',
      analytics: 'Xarajatlar',
    },
    hint: 'Chapdagi bo’limlarni aylanib chiqing — hammasi jonli.',
  },
  words: {
    eyebrow: 'Eng muhimi',
    title: 'Bir marta aytdingiz — qoida bo’ldi',
    lead: 'Sozlama ham, konstruktor ham yo’q. Odamga qanday aytsangiz, shunday aytasiz:',
    instruction:
      'Har dushanba ertalab 10da brigadirlardan obyektlarda nima qilinganini so’rab, menga jadval qilib yubor.',
    result: 'Tamom. Endi bu har dushanba o’zi bo’lib turadi.',
    correction:
      '«Sakkizda yubor, obyekt fotosini qo’sh» — keyingi dushanbadan shunday.',
    explain:
      'Oddiy dastur faqat dasturchi kiritgan narsani qiladi. Bu yerda esa u nimani bilishini o’zingiz hal qilasiz — oddiy so’z bilan. Shuning uchun shaurmaxona bilan qurilish firmasidan ikki xil yordamchi chiqadi: ularni hech kim oldindan o’ylab qo’ygani yo’q.',
    switcherLabel: 'O’z biznesingiz misolida ko’ring:',
    businesses: [
      {
        id: 'restaurant',
        name: 'Restoran',
        cases: [
          'Kassa yopilganda administratordan tushumni, oshxonadan chiqitni so’rab ol. Raqamlar to’g’ri kelmasa — ertalabki svodkada ko’rsat.',
          'Kartalardagi sharhlarni kuzatib bor. Yomonlariga menga javob tayyorla, yaxshilariga o’zing rahmat ayt.',
          'Har kuni ertalab ombor qoldiqlarini tekshir va tugab borayotganini ta’minotchiga eslat.',
        ],
      },
      {
        id: 'retail',
        name: 'Do’konlar tarmog’i',
        cases: [
          'Har kuni 21:00da har do’kondan tushum bilan qoldiqni so’ra, bitta jadvalga jamla. Orqada ketayotgan nuqtani belgilab qo’y.',
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
          'Yetkazib beruvchidan yangi smeta kelsa, o’tgan oygi narxlar bilan solishtir. Qimmatlab ketganini menga ro’yxat qilib ber.',
        ],
      },
      {
        id: 'clinic',
        name: 'Klinika',
        cases: [
          'Ertangi qabulga yozilganlarga bugun eslatma yubor. Kimdir kelolmasa — bo’shagan vaqtga navbatdagini taklif qil.',
          'Har kuni kechqurun — nechta qabul, nechta bekor qilingan, nechta yangi murojaat.',
          'Saytdan va messenjerlardan kelgan so’rovlarni bazaga kirit, birinchi javobni tayyorlab qo’y.',
        ],
      },
    ],
  },
  pillars: {
    eyebrow: 'Bu nimaga tayanadi',
    title: 'U dasturday emas, yordamchiday qurilgan',
    items: [
      {
        name: 'Eslab qoladi',
        text:
          'Kim nima va’da bergan, martda nima kelishilgan — hammasi yodida. Bu xotira oynani yopsangiz o’chmaydi, yangi chatda nolga tushmaydi.',
      },
      {
        name: 'Bajaradi',
        text:
          'Maslahat berib o’tirmaydi — qiladi: odamlarga o’zi yozadi, raqamlarni yig’adi, jim qolganlarga eslatadi, so’rovlarni CRMga kiritadi. Sizga tekshirish qoladi — o’zingiz qilib o’tirish emas.',
      },
      {
        name: 'O’rganadi',
        text:
          'Bir marta «mijozlarga qisqa yoz» deysiz — bu unga umrbod qoida. Bir oydan keyin ishni xuddi o’zingizday qiladi.',
      },
      {
        name: 'Kechasi ham ishlaydi',
        text:
          'Svodka 9:00gacha Telegramingizda. Kunduzi qo’l tegmaydigan ishlarni kechasi qiladi. Jadvalini o’zi eslab yuradi.',
      },
      {
        name: 'Sizniki',
        text:
          'Kompyuteringizda yashaydi. Yozishmalar, xotira, raqamlar o’zingizda qoladi — birovning bulutida emas. Ishdan bo’shab, bilganini olib keta olmaydi.',
      },
    ],
  },
  voice: {
    eyebrow: 'Shunchaki gaplashish',
    title: 'Shu yerda Jarvis o’xshatish bo’lmay qoladi',
    text:
      'Mashinada ketyapsiz, yangi nuqta haqida o’ylab boryapsiz — u bilan xuddi odam bilan gaplashganday ovozda gaplashasiz. U ham ovozda javob beradi: butun biznesingizni biladi, martdagi muzokara nima bilan tugaganini eslaydi. Oxirida «endi shu bilan shug’ullan» deysiz — ishga kirishadi.',
    sphereHint: 'Pastdagi sfera jonli. Bosing-da, Echelon haqida ovozda so’rang.',
    talkButton: 'Gaplashish',
    stopButton: 'Tugatish',
    listening: 'Eshityapti…',
    thinking: 'O’ylayapti…',
    speaking: 'Gapiryapti',
    connecting: 'Ulanyapti…',
    unavailable: 'Qanday gapirishini eshitib ko’ring:',
    playRecording: 'Yozuvni qo’yish',
    micDenied: 'Mikrofonga ruxsat kerak',
    error: 'Ulanib bo’lmadi. Keyinroq urinib ko’ring.',
  },
  honesty: {
    eyebrow: 'Ertak aytmaymiz',
    title: 'Qarorni u tayyorlaydi. Siz qabul qilasiz',
    paragraphs: [
      'Shartnoma imzolamaydi, pul o’tkazmaydi, odam yollamaydi, bo’shatmaydi — so’rasangiz ham. Kundalik ishni oxirigacha o’zi qiladi, qarorni esa tayyor holida oldingizga qo’yadi.',
      'U bitta odamga — egasiga sozlanadi. Bu kamchilik emas, pozitsiya: yordamchining xo’jayini bitta bo’ladi.',
      'U sehrgar emas. Bu sahifada yozilganlarning hammasi — uning har kungi ishi. Undan ortig’ini va’da qilmaymiz.',
    ],
    setup:
      'Echelon Desktop Windows, macOS yoki Linux kompyuteringizga o’rnatiladi va shaxsan sizga sozlanadi — odamlaringizga, tartiblaringizga. U kompyuterda yashaydi, yozish esa istalgan joydan mumkin — telefondagi Telegramdan ham.',
  },
  math: {
    eyebrow: 'Odamga chaqib ko’ring',
    title: 'To’g’ri taqqoslash — dastur bilan emas, shtatdagi odam bilan',
    rows: [
      { label: 'Oylikni har oy oladi', human: 'ha', echelon: 'yo’q' },
      { label: 'Uxlaydi, kasal bo’ladi, ta’tilga chiqadi', human: 'ha', echelon: 'yo’q' },
      { label: 'Bo’shab ketadi va eslaganini olib ketadi', human: 'ha', echelon: 'yo’q' },
      { label: 'Har bir kelishuvni so’zma-so’z eslab qoladi', human: 'yo’q', echelon: 'ha' },
      { label: 'Kechasi va dam olish kunlari ishlaydi', human: 'yo’q', echelon: 'ha' },
    ],
    humanCol: 'Shtatdagi yordamchi',
    echelonCol: 'Echelon Desktop',
    bottom:
      'Aniq raqamni demoda aytamiz: u yana bitta xodimning oyligidan ancha kam chiqadi.',
  },
  finalCta: {
    title: 'Hisobotni sizning biznesingizda qanday yig’ishini ko’ring',
    text:
      'Telegramda yozing — jonli demo vaqtini kelishib olamiz. Yarim soat, hech narsa o’rnatilmaydi: qanday ishlashini o’z ishingizdagi misollarda ko’rasiz.',
    button: 'Telegramda yozish',
    note: '@komrxn · Telegram',
  },
  footer: {
    product: 'Echelon Desktop',
    line: 'Biznes egasining shaxsiy yordamchisi. Sizning kompyuteringizda ishlaydi.',
    demoNote: 'Bu sahifadagi misollar — namoyish uchun.',
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
      paused: 'pauzada',
    },
    graph: {
      stats: 'tugunlar: {n} · bog’lanishlar: {e}',
      legend: {
        owner: 'Siz',
        people: 'Odamlar',
        projects: 'Loyihalar',
        memories: 'Kelishuvlar',
        themes: 'Mavzular',
      },
      hint: 'G’ildirak — masshtab · fonni torting · tugunni bosing',
      card: {
        links: 'bog’lanishlar',
        types: {
          owner: 'Siz',
          job: 'Biznes',
          person: 'Odam',
          project: 'Loyiha',
          memory: 'Kelishuv',
          theme: 'Mavzu',
          thought: 'Qayd',
        },
      },
      data: {
        job: 'Sizning biznesingiz',
        people: [
          'Alisher · yetkazib beruvchi', 'Dilshod · mijoz', 'Timur · brigadir', 'Rustam · brigadir',
          'Zarina · buxgalter', 'Otabek · boshqaruvchi', 'Jasur · prorab', 'Nodira · menejer',
          'Sanjar · yetkazib beruvchi', 'Bekzod · haydovchi', 'Umid · mijoz', 'Gulnora · kassir',
          'Farrux · hamkor', 'Aziz · ta’minotchi', 'Shahnoza · menejer', 'Komil · mijoz',
          'Madina · buxgalter', 'Ikrom · pudratchi', 'Sevara · administrator', 'Bahodir · yetkazib beruvchi',
          'Lola · mijoz', 'Sherzod · brigadir', 'Diyora · menejer', 'Ulug’bek · hamkor',
        ],
        projects: [
          'Chilonzor obyekti', 'Yunusobod obyekti', 'Yangi nuqta', 'Kabel yetkazish',
          'Ombor ta’miri', 'Pardozlash tenderi', 'Qadoq xaridi', 'Kompaniya sayti',
          'Ofis ko’chishi', 'Ijara shartnomasi', 'Sertifikatlash', 'Smena yollash',
        ],
        themes: ['Ta’minot', 'Narxlar', 'Xodimlar', 'Mijozlar', 'Ombor', 'Hisobotlar', 'Ijara', 'Reklama'],
        memoryTemplates: [
          '14 kun kechiktirish — {p}',
          '50 blokdan chegirma — {p}',
          'To’lov yetkazilganda — {p}',
          'Yetkazish uning hisobidan — {p}',
          'Dushanba kunlari obyekt fotosi — {p}',
          '20:00dan keyin qo’ng’iroq yo’q — {p}',
          '30% oldindan to’lov — {p}',
          'Hisobni shartnoma bilan solishtirish — {p}',
          'Hisobot 19:00gacha — {p}',
          'O’zbekcha yozish — {p}',
        ],
        thoughtTemplates: [
          '{t} bo’yicha narxlarni tekshirish',
          'Planyorkada {t} masalasi',
          '{t} bo’yicha risk',
          'G’oya: {t}ni avtomatlashtirish',
        ],
      },
    },
    vault: {
      searchNote: 'Qatorni bosing — yozuv ochiladi',
      filters: { all: 'Hammasi', person: 'Odamlar', project: 'Loyihalar', memory: 'Kelishuvlar', theme: 'Mavzular' },
      cols: { label: 'Nomi', type: 'Turi', summary: 'Qisqacha', updated: 'Yangilangan' },
      rows: [
        { label: 'alisher', type: 'person', summary: 'Blok yetkazib beruvchi · 14 kun kechiktirish, yetkazish undan', updated: '2 soat oldin' },
        { label: 'dilshod', type: 'person', summary: 'Mijoz · buyurtma asosida, kechgacha raqam kutyapti', updated: 'bugun' },
        { label: 'zarina', type: 'person', summary: 'Buxgalter · ekvayringni 20:00gacha yuboradi', updated: 'kecha' },
        { label: 'chilonzor obyekti', type: 'project', summary: 'Suvoq 80% · elektrika kabel kutyapti', updated: '3 soat oldin' },
        { label: 'yangi nuqta', type: 'project', summary: 'Ishga tushirish ro’yxati · 18 tadan 12 tasi yopildi', updated: 'kecha' },
        { label: 'alisher kechiktirishi', type: 'memory', summary: '12-martdan 14 kun · yozishmadan qayd qilingan', updated: 'mart' },
        { label: 'hisobot qoidasi', type: 'memory', summary: 'Brigadirlar — dushanba 10:00, foto bilan', updated: 'iyul' },
        { label: 'mijozlarga ohang', type: 'memory', summary: 'Qisqa, rasmiyatchiliksiz, doim «siz»da', updated: 'iyun' },
        { label: 'ta’minot', type: 'theme', summary: '3 yetkazib beruvchi · har biri bo’yicha narx va jadval', updated: 'bugun' },
        { label: 'xodimlar', type: 'theme', summary: 'Smenalar, tabel, ikkita ochiq o’rin', updated: 'kecha' },
      ],
    },
    analytics: {
      kpis: [
        { label: 'Bugun', value: '$0.62' },
        { label: 'Bu hafta', value: '$4.18' },
        { label: 'Bugungi javoblar', value: '27' },
      ],
      days: ['du', 'se', 'cho', 'pa', 'ju', 'sha', 'ya'],
      values: [0.54, 0.71, 0.48, 0.66, 0.62, 0.31, 0.24],
      note: 'Narx haqiqiy billing bo’yicha, taxmin emas. Kunlik limit — $5.',
    },
  },
};

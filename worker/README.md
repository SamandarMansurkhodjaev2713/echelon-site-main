# Живая сфера — Cloudflare Worker (10 минут)

Воркер держит твой ключ Gemini у себя и выдаёт странице одноразовые токены.
Системный промпт и модель зашиты в токен на сервере — посетитель не может их
подменить. Лимиты: 5 разговоров с одного IP в день, 60 в день всего
(меняются в `worker.js`, константы `PER_IP_PER_DAY` / `GLOBAL_PER_DAY`).

## Шаги

1. Ключ Gemini: https://aistudio.google.com/apikey → Create API key. Скопируй.

2. В терминале:

```sh
cd ~/Projects/echelon-site/worker
npx wrangler login          # откроется браузер, войди в Cloudflare (бесплатный план ок)
npx wrangler kv namespace create RATE
```

Команда выведет `id = "..."` — вставь его в `wrangler.toml` вместо
`PASTE_KV_ID_HERE`.

3. Секрет и деплой:

```sh
npx wrangler secret put GEMINI_API_KEY   # вставь ключ из шага 1
npx wrangler deploy
```

В конце деплоя будет URL вида `https://echelon-voice.<твой-акк>.workers.dev`.

4. Пришли мне этот URL (или сам: впиши его в
`src/lib/config.ts` → `VOICE_WORKER_URL`, закоммить в main — сайт пересоберётся,
кнопка «Поговорить» появится сама).

## Проверить, что воркер жив

```sh
curl -s -X POST https://echelon-voice.<твой-акк>.workers.dev/token \
  -H 'content-type: application/json' -H 'Origin: https://komrxn.github.io' \
  -d '{"locale":"ru"}'
```

Должен вернуться JSON с `"token": "auth_tokens/..."`. Пришли мне вывод — я
проверю остальное сам.

## Сколько это стоит

Cloudflare — бесплатно (Free plan, лимитов воркера хватает с запасом).
Gemini Live тарифицируется за секунды аудио по твоему ключу — при лимите
60 разговоров/день по 4 минуты максимум это ограничено сверху; следи за
квотой в AI Studio первые дни.

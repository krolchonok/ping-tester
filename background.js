let defaultUrl = "https://example.com"; // URL по умолчанию

// Функция для получения интервала из хранилища
async function getPingInterval() {
  const { periodInMinutes } = await browser.storage.local.get({ periodInMinutes: 2 / 60 }); // Значение по умолчанию 2 минуты
  return periodInMinutes;
}

// Функция для вычисления пинга
async function measurePing() {
  const { targetUrl } = await browser.storage.local.get({ targetUrl: defaultUrl });
  const startTime = Date.now();
  try {
    await fetch(targetUrl, { method: "HEAD", cache: "no-store" });
    const ping = Date.now() - startTime;
    updateBadge(ping);
    updateIcon(targetUrl); // Обновление favicon
  } catch (error) {
    updateBadge("ERR");
  }
}

// Функция для обновления значка
function updateBadge(ping) {
  const text = typeof ping === "number" ? `${ping}` : "ERR";
  browser.action.setBadgeText({ text });
  browser.action.setBadgeBackgroundColor({ color: ping === "ERR" ? "red" : "green" });
}

// Функция для обновления иконки
async function updateIcon(targetUrl) {
  console.log(targetUrl);
  const faviconUrl = new URL("/favicon.ico", targetUrl).href;

  try {
    // Попробуем загрузить favicon из кеша
    const { cachedFavicon } = await browser.storage.local.get("cachedFavicon");

    // Проверка кеша: URL совпадает и кеш не устарел (например, 1 день)
    const cacheValid = cachedFavicon && cachedFavicon.url === faviconUrl && Date.now() - cachedFavicon.timestamp < 24 * 60 * 60 * 1000;

    if (cacheValid) {
      // Используем кешированную иконку
      browser.action.setIcon({ path: cachedFavicon.dataUrl });
      return;
    }

    // Загружаем favicon с сервера
    const response = await fetch(faviconUrl, { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to fetch favicon");
    const blob = await response.blob();

    // Преобразуем в Data URL
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      const dataUrl = reader.result;

      // Устанавливаем иконку
      browser.action.setIcon({ path: dataUrl });

      // Сохраняем в кеш
      await browser.storage.local.set({
        cachedFavicon: {
          url: faviconUrl,
          dataUrl: dataUrl,
          timestamp: Date.now(),
        },
      });
    };
  } catch (error) {
    console.error("Ошибка загрузки favicon:", error);
    // Установим значок по умолчанию при ошибке
    browser.action.setIcon({ path: "default_icon.png" });
  }
}

// Установка интервала
async function setupPingInterval() {
  const pingInterval = await getPingInterval(); // Получаем интервал из хранилища
  browser.alarms.create("pingTimer", { periodInMinutes: pingInterval });
}

// Запуск при старте
measurePing();
setupPingInterval();

// Обработчик для обновления интервала, если он изменится в хранилище
browser.storage.onChanged.addListener(async (changes, area) => {
  if (area === "local" && changes.periodInMinutes) {
    const newPingInterval = changes.periodInMinutes.newValue;
    browser.alarms.clear("pingTimer"); // Убираем старый alarm
    browser.alarms.create("pingTimer", { periodInMinutes: newPingInterval }); // Устанавливаем новый alarm
  }
});

// Слушаем alarm
browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "pingTimer") {
    measurePing();
  }
});

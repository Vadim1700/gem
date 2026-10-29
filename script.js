(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const settingsOverlay = $("#settingsOverlay");
  const progressOverlay = $("#progressOverlay");
  const generateBtn = $("#generateBtn");

  const resources = {
    gold: { name: "Золото", icon: "🟨", image: "images/gold.png", min: 3, max: 7 },
    copper: { name: "Медь", icon: "🟠", image: "images/copper.png", min: 4, max: 12 },
    diamond: { name: "Алмаз", icon: "💎", image: "images/diamond.png", min: 2, max: 7 },
    emerald: { name: "Изумруд", icon: "🟩", image: "images/emerald.png", min: 0, max: 5 },
    crafting: { name: "Верстак", icon: "🧰", image: "images/crafting.png", min: 1, max: 4 },
    tnt: { name: "ТНТ", icon: "🧨", image: "images/tnt.png", min: 1, max: 5 }
  };

  const pickaxes = [
    { name: "Железная", image: "images/pickaxe-wood.png" },
    { name: "Железная", image: "images/pickaxe-stone.png" },
    { name: "Алмазная", image: "images/pickaxe-iron.png" },
    { name: "Алмазная", image: "images/pickaxe-diamond.png" }
  ];

  const stages = [
    { at: 0, title: "Подключение к системе", sub: "Устанавливаем защищённый канал и подготавливаем генератор…", status: "Инициализация" },
    { at: 25, title: "Синхронизация узла", sub: "Проверяем соединение и синхронизируем параметры сессии…", status: "Подключение к узлу" },
    { at: 52, title: "Анализ параметров", sub: "Обрабатываем активные модули и собираем конфигурацию сигнала…", status: "Анализ данных" },
    { at: 78, title: "Формирование сигнала", sub: "Финальная сборка результата. Осталось совсем немного…", status: "Сборка сигнала" }
  ];

  let generationTimer = null;
  let online = 78;
  let generationRun = 0;

  const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  function openOverlay(element) {
    element.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeOverlay(element) {
    element.classList.remove("open");
    if (!$(".overlay.open")) document.body.style.overflow = "";
  }

  function cancelGeneration() {
    generationRun += 1;
    if (generationTimer) clearInterval(generationTimer);
    generationTimer = null;
    generateBtn.disabled = false;
  }

  $("#openSettings").addEventListener("click", () => openOverlay(settingsOverlay));

  $$("[data-close]").forEach(button => {
    button.addEventListener("click", () => {
      const overlay = $("#" + button.dataset.close);
      closeOverlay(overlay);
      if (overlay === progressOverlay) cancelGeneration();
    });
  });

  [settingsOverlay, progressOverlay].forEach(overlay => {
    overlay.addEventListener("click", event => {
      if (event.target === overlay) {
        closeOverlay(overlay);
        if (overlay === progressOverlay) cancelGeneration();
      }
    });
  });

  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    if (progressOverlay.classList.contains("open")) {
      closeOverlay(progressOverlay);
      cancelGeneration();
    } else if (settingsOverlay.classList.contains("open")) {
      closeOverlay(settingsOverlay);
    }
  });

  function updateProfileCount() {
    const count = $$(".resource-toggle").filter(input => input.checked).length + ($("#togglePickaxe").checked ? 1 : 0);
    const ending = count === 1 ? "модуль" : count >= 2 && count <= 4 ? "модуля" : "модулей";
    $("#profileCount").textContent = `${count} ${ending}`;
  }

  $$(".resource-toggle").forEach(input => input.addEventListener("change", updateProfileCount));
  $("#togglePickaxe").addEventListener("change", updateProfileCount);
  $("#saveSettings").addEventListener("click", () => {
    updateProfileCount();
    closeOverlay(settingsOverlay);
  });

  window.setInterval(() => {
    online = Math.max(50, Math.min(100, online + randomInt(-5, 5)));
    $("#onlineCount").textContent = String(online);
  }, 3600);

  function createSignal() {
    const items = [];

    if ($("#togglePickaxe").checked) {
      const tool = pickaxes[randomInt(0, pickaxes.length - 1)];
      items.push({ name: "Тип кирки", value: tool.name, icon: "⛏️", image: tool.image, wide: true });
    }

    $$(".resource-toggle").forEach(toggle => {
      if (!toggle.checked) return;
      const resource = resources[toggle.dataset.key];
      items.push({
        name: resource.name,
        value: `${randomInt(resource.min, resource.max)} шт.`,
        icon: resource.icon,
        image: resource.image,
        wide: toggle.dataset.key === "crafting" || toggle.dataset.key === "tnt"
      });
    });

    return items;
  }

  function setStage(percent) {
    let stageIndex = 0;
    stages.forEach((stage, index) => {
      if (percent >= stage.at) stageIndex = index;
    });

    const stage = stages[stageIndex];
    $("#progressTitle").textContent = stage.title;
    $("#progressSub").textContent = stage.sub;
    $("#progressStatus").textContent = stage.status;
    $("#progressFill").style.width = `${percent}%`;
    $("#progressPercent").textContent = `${percent}%`;

    $$("#logList li").forEach((item, index) => {
      item.classList.toggle("done", index < stageIndex);
      item.classList.toggle("active", index === stageIndex);
      $(".log-dot", item).textContent = index < stageIndex ? "✓" : String(index + 1);
    });
  }

  function renderResult(items) {
    $("#loadingView").hidden = true;
    const view = $("#resultView");
    view.hidden = false;

    const time = new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    let markup = `<div class="result-top"><span class="result-badge"><span class="dot"></span> СИГНАЛ СФОРМИРОВАН</span><span class="result-time">${time}</span></div>
      <h2 class="result-heading">Сигнал готов</h2>
      <p class="result-sub">Параметры текущей сессии успешно собраны</p>`;

    if (!items.length) {
      markup += '<p class="result-sub">Нет активных модулей. Открой настройки и включи хотя бы один элемент, чтобы получить результат.</p>';
    } else {
      markup += '<div class="result-items">';
      items.forEach(item => {
        const icon = item.image
          ? `<img src="${item.image}" alt="" onerror="this.remove()">`
          : item.icon;
        markup += `<div class="result-item ${item.wide ? "wide" : ""}">
          <div class="result-icon">${icon}</div>
          <div><div class="result-label">${item.name}</div><div class="result-value">${item.value}</div></div>
        </div>`;
      });
      markup += "</div>";
    }

    markup += `<div class="result-actions"><button class="primary-btn" id="againBtn">↻ Новый сигнал</button><button class="secondary-btn" id="doneBtn">Готово</button></div>
      <p class="disclaimer">Результат сгенерирован локально на основе выбранных настроек.</p>`;

    view.innerHTML = markup;
    $("#againBtn").addEventListener("click", startGeneration);
    $("#doneBtn").addEventListener("click", () => closeOverlay(progressOverlay));
  }

  function startGeneration() {
    cancelGeneration();
    const thisRun = generationRun;
    generateBtn.disabled = true;
    $("#loadingView").hidden = false;
    $("#resultView").hidden = true;
    $("#resultView").innerHTML = "";
    setStage(0);
    openOverlay(progressOverlay);

    const duration = 6100;
    const start = Date.now();

    generationTimer = window.setInterval(() => {
      if (thisRun !== generationRun) return;
      const percent = Math.min(100, Math.floor(((Date.now() - start) / duration) * 100));
      setStage(percent);

      if (percent >= 100) {
        clearInterval(generationTimer);
        generationTimer = null;
        const runAtFinish = generationRun;
        window.setTimeout(() => {
          if (runAtFinish !== generationRun || !progressOverlay.classList.contains("open")) return;
          renderResult(createSignal());
          generateBtn.disabled = false;
        }, 350);
      }
    }, 100);
  }

  generateBtn.addEventListener("click", startGeneration);
  updateProfileCount();
})();
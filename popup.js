document.addEventListener("DOMContentLoaded", async () => {
  const urlInput = document.getElementById("urlInput");
  const urlTime = document.getElementById("urlTime");

  const saveButton = document.getElementById("saveButton");
  const statusMessage = document.getElementById("statusMessage");
  const statusMessageTimeout = document.getElementById("statusMessageTimeout");

  const { targetUrl } = await browser.storage.local.get({ targetUrl: "https://example.com" });
  const { periodInMinutes } = await browser.storage.local.get({ periodInMinutes: 2 / 60 });

  urlInput.value = targetUrl;
  urlTime.value = periodInMinutes * 60;

  async function save() {
    const newUrl = urlInput.value.trim();
    if (!newUrl) {
      statusMessage.textContent = "Please enter a valid URL.";
      statusMessage.style.color = "red";
      return;
    }

    const newInterval = urlTime.value.trim();
    try {
      newTime = parseInt(newInterval) / 60;
      if (isNaN(newTime)) {
        throw new Error("Не удалось преобразовать в число");
      }
    } catch (error) {
      newTime = 2 / 60;
    }

    try {
      new URL(newUrl);
      await browser.storage.local.set({ targetUrl: newUrl });
      await browser.storage.local.set({ periodInMinutes: newTime });

      statusMessage.textContent = "URL saved successfully!";
      statusMessage.style.color = "green";
      setTimeout(() => {
        statusMessage.textContent = "";
      }, 2000);
    } catch {
      statusMessage.textContent = "Invalid URL format.";
      statusMessage.style.color = "red";
    }
  }

  saveButton.addEventListener("click", save);

  urlInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      save();
    }
  });

  urlTime.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      save();
    }
  });
});

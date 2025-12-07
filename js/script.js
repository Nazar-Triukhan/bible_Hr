// ==========================
// LOAD & SAVE DATA FOR PLAN
// ==========================

function loadData() {
  return JSON.parse(localStorage.getItem("bibleData") || "{}");
}

function saveData(data) {
  localStorage.setItem("bibleData", JSON.stringify(data));
}

const data = loadData();

function render() {
  const container = document.getElementById("plan");
  container.innerHTML = "";

  biblePlan.forEach(dayObj => {
    const div = document.createElement("div");
    div.className = "day";

    const dayTitle = document.createElement("div");
    dayTitle.className = "day-header";
    dayTitle.innerHTML = `<h3>Day ${dayObj.day}</h3>`;

    const chaptersList = document.createElement("div");

    dayObj.chapters.forEach(ch => {
      const p = document.createElement("p");
      p.className = "chapter";
      p.innerText = ch;

      const key = `day${dayObj.day}_${ch}`;
      if (data[key]) p.classList.add("checked");

      p.addEventListener("click", () => {
        p.classList.toggle("checked");
        data[key] = p.classList.contains("checked");
        saveData(data);
      });

      chaptersList.appendChild(p);
    });

    const textarea = document.createElement("textarea");
    textarea.placeholder = "Your notes for this day...";
    textarea.value = data[`notes_day${dayObj.day}`] || "";

    textarea.addEventListener("input", () => {
      data[`notes_day${dayObj.day}`] = textarea.value;
      saveData(data);
    });

    div.appendChild(dayTitle);
    div.appendChild(chaptersList);
    div.appendChild(textarea);
    container.appendChild(div);
  });
}

render();


// =====================================
// BIG NOTE — Manual Save (Button Works)
// =====================================

const bigNote = document.getElementById("bigNote");
const saveBtn = document.getElementById("saveNoteBtn");
const statusText = document.getElementById("status");

// LOAD SAVED NOTE
bigNote.value = localStorage.getItem("bigNote") || "";

// SAVE NOTE
saveBtn.addEventListener("click", () => {
  localStorage.setItem("bigNote", bigNote.value);

  statusText.textContent = "Saved!";
  statusText.style.color = "green";

  // Fade out after 1 second
  setTimeout(() => {
    statusText.textContent = "";
  }, 1000);
});

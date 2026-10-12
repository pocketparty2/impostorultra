let players = [];
let currentPlayer = 0;
let chosenPair = null;
let impostorIndex = null;
let impostorIndices = [];
let starterPlayer = null;
let draggedPlayerIndex = null;
let allImpostorsMode = false;
let allImpostorsThisRound = false;
let doubleTroubleMode = false;
let doubleTroubleThisRound = false;
let screen = document.getElementById("screen");

function start() {
  currentPlayer = 0;
  draggedPlayerIndex = null;

  screen.innerHTML = `
    <h1>Word Impostor</h1>

    <div class="menuBox">
      <h2 id="playerHeading">Players (0)</h2>
      <div id="playerList"></div>

      <div class="addPlayerArea">
        <input
          type="text"
          id="playerNameInput"
          placeholder="Enter player name..."
          maxlength="30"
          autocomplete="off"
        >
        <button onclick="addPlayer()">Add Player</button>
        <p id="playerError" style="color:#ff3333;font-weight:bold;"></p>
      </div>
    </div>

    <div class="menuBox">
      <h2>Word Packs</h2>
      <div id="equippedPacks"></div>
      <button id="managePacksBtn" onclick="togglePackDropdown()">Manage Word Packs</button>
      <div id="packDropdown"></div>
    </div>

    <div class="menuBox">
      <h2>Game Settings</h2>
      <h3>Impostor Count Settings</h3>

      <label class="settingToggle">
        <input
          type="checkbox"
          id="allImpostorsToggle"
          ${allImpostorsMode ? "checked" : ""}
        >
        <span class="toggleSlider"></span>
        <span class="settingText">
          <strong>😈 Chaos Mode</strong>
          <small>25% chance of everyone being an impostor</small>
        </span>
      </label>

      <label class="settingToggle">
        <input
          type="checkbox"
          id="doubleTroubleToggle"
          ${doubleTroubleMode ? "checked" : ""}
        >
        <span class="toggleSlider"></span>
        <span class="settingText">
          <strong>👥 Double Trouble Mode</strong>
          <small>25% chance of having two impostors</small>
        </span>
      </label>
    </div>

    <button id="startBtn" onclick="beginGame()" style="margin-top:20px;">Start Game</button>
  `;

  document.getElementById("allImpostorsToggle").addEventListener("change", event => {
    allImpostorsMode = event.target.checked;

    if (allImpostorsMode) {
      doubleTroubleMode = false;
      document.getElementById("doubleTroubleToggle").checked = false;
    }
  });

  document.getElementById("doubleTroubleToggle").addEventListener("change", event => {
    doubleTroubleMode = event.target.checked;

    if (doubleTroubleMode) {
      allImpostorsMode = false;
      document.getElementById("allImpostorsToggle").checked = false;
    }
  });

  updatePlayerList();
  updateEquippedPacks();
  buildPackDropdown();
  updateStartButton();

  document.getElementById("playerNameInput").addEventListener("keydown", event => {
    if (event.key === "Enter") {
      addPlayer();
    }
  });
}

function addPlayer() {
  const input = document.getElementById("playerNameInput");
  const error = document.getElementById("playerError");
  const name = input.value.trim();

  if (name.length < 2) {
    error.textContent = "Name must be at least 2 characters long!";
    input.focus();
    return;
  }

  if (players.some(player => player.toLowerCase() === name.toLowerCase())) {
    error.textContent = "That player has already been added!";
    input.focus();
    return;
  }

  players.push(name);
  input.value = "";
  error.textContent = "";

  updatePlayerList();
  updateStartButton();
  input.focus();
}

function removePlayer(index) {
  if (index < 0 || index >= players.length) return;

  players.splice(index, 1);
  updatePlayerList();
  updateStartButton();
}

function updatePlayerList() {
  const container = document.getElementById("playerList");
  const heading = document.getElementById("playerHeading");

  if (!container || !heading) return;

  heading.textContent = `Players (${players.length})`;

  container.innerHTML = players
    .map(
      (p, i) => `
        <div class="playerBox" data-index="${i}">
          <span
            class="dragHandle"
            title="Drag to reorder"
            aria-label="Drag to reorder"
            draggable="true"
          >⠿</span>
          <span class="playerName">${escapeHTML(p)}</span>
          <span class="removeBtn" data-remove="${i}" title="Remove player">✕</span>
        </div>
      `
    )
    .join("");

  if (players.length === 0) {
    container.innerHTML = "<p>No players added yet</p>";
    return;
  }

  container.querySelectorAll(".removeBtn").forEach(button => {
    button.addEventListener("click", () => {
      removePlayer(Number(button.dataset.remove));
    });
  });

  container.querySelectorAll(".dragHandle").forEach(handle => {
    handle.addEventListener("dragstart", event => {
      const box = handle.closest(".playerBox");
      draggedPlayerIndex = Number(box.dataset.index);

      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", String(draggedPlayerIndex));

      box.classList.add("dragging");
    });

    handle.addEventListener("dragend", () => {
      draggedPlayerIndex = null;

      container.querySelectorAll(".playerBox").forEach(box => {
        box.classList.remove("dragging");
      });
    });
  });

  container.querySelectorAll(".playerBox").forEach(box => {
    box.addEventListener("dragover", event => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    });

    box.addEventListener("drop", event => {
      event.preventDefault();

      const fromIndex = draggedPlayerIndex;
      const toIndex = Number(box.dataset.index);

      if (
        fromIndex === null ||
        !Number.isInteger(fromIndex) ||
        fromIndex < 0 ||
        fromIndex >= players.length ||
        fromIndex === toIndex
      ) {
        return;
      }

      const movedPlayer = players.splice(fromIndex, 1)[0];
      players.splice(toIndex, 0, movedPlayer);

      draggedPlayerIndex = null;
      updatePlayerList();
    });
  });
}

function escapeHTML(text) {
  return String(text).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function updateEquippedPacks() {
  const container = document.getElementById("equippedPacks");
  if (!container) return;

  if (enabledPacks.length === 0) {
    container.innerHTML = "<p>No packs enabled</p>";
    return;
  }

  container.innerHTML = enabledPacks
    .map(pack => `<div class="packBox">${escapeHTML(pack)}</div>`)
    .join("");
}

function togglePackDropdown() {
  const panel = document.getElementById("packDropdown");
  panel.style.display = panel.style.display === "none" ? "block" : "none";
}

function buildPackDropdown() {
  const container = document.getElementById("packDropdown");
  container.innerHTML = "";

  Object.keys(WORD_PACKS).forEach(pack => {
    const enabled = enabledPacks.includes(pack);
    const btn = document.createElement("button");

    btn.textContent = pack;
    btn.className = enabled ? "" : "disabledPack";
    btn.onclick = () => togglePack(pack);

    container.appendChild(btn);
  });
}

function togglePack(pack) {
  if (enabledPacks.includes(pack)) {
    enabledPacks = enabledPacks.filter(p => p !== pack);
  } else {
    enabledPacks.push(pack);
  }

  buildPackDropdown();
  updateEquippedPacks();
}

function updateStartButton() {
  const btn = document.getElementById("startBtn");
  if (!btn) return;

  if (players.length < 3) {
    btn.disabled = true;
    btn.style.background = "#ff9999";
    btn.textContent = `Need ${3 - players.length} more player${3 - players.length === 1 ? "" : "s"}`;
  } else {
    btn.disabled = false;
    btn.style.background = "#ff3333";
    btn.textContent = "Start Game";
  }
}

function beginGame() {
  if (players.length < 3) {
    alert("You need at least 3 players!");
    return;
  }

  if (enabledPacks.length === 0) {
    alert("Enable at least one word pack!");
    return;
  }

  const pool = enabledPacks.flatMap(pack => WORD_PACKS[pack]);

  if (pool.length === 0) {
    alert("The enabled word packs contain no words!");
    return;
  }

  chosenPair = pool[Math.floor(Math.random() * pool.length)];

  allImpostorsThisRound = allImpostorsMode && Math.random() < 0.25;
  doubleTroubleThisRound =
    !allImpostorsThisRound &&
    doubleTroubleMode &&
    Math.random() < 0.25;

  impostorIndices = [];

  if (allImpostorsThisRound) {
    impostorIndex = null;
  } else if (doubleTroubleThisRound) {
    const shuffledIndices = players.map((_, index) => index);

    for (let i = shuffledIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledIndices[i], shuffledIndices[j]] =
        [shuffledIndices[j], shuffledIndices[i]];
    }

    impostorIndices = shuffledIndices.slice(0, 2);
    impostorIndex = impostorIndices[0];
  } else {
    impostorIndex = Math.floor(Math.random() * players.length);
    impostorIndices = [impostorIndex];
  }

  currentPlayer = 0;
  showRole();
}

function showRole() {
  if (currentPlayer >= players.length) {
    starterPlayer = players[Math.floor(Math.random() * players.length)];

    screen.innerHTML = `
      <h1>All words assigned</h1>
      <p style="color:#ff3333;font-weight:bold;">
        ${escapeHTML(starterPlayer)} starts the conversation!
      </p>
      <p>Discuss and give clues!</p>
      <button onclick="startReveal()">Reveal Impostor</button>
    `;
    return;
  }

  screen.innerHTML = `
    <h1>${escapeHTML(players[currentPlayer])}</h1>
    <button onclick="reveal()">Reveal Word</button>
  `;
}

function reveal() {
  const isImpostor =
    allImpostorsThisRound || impostorIndices.includes(currentPlayer);

  const word = isImpostor ? chosenPair.impostor : chosenPair.real;

  screen.innerHTML = `
    <h1>${escapeHTML(players[currentPlayer])}</h1>
    ${
      isImpostor
        ? `<h2 style="color:#ff3333;">You are the IMPOSTOR!</h2>
           <p>Your word is only a <b>hint</b>.</p>`
        : `<p>Your word is:</p>`
    }
    <h2>${escapeHTML(word)}</h2>
    <button onclick="nextPlayer()">Hide</button>
  `;
}

function nextPlayer() {
  currentPlayer++;
  showRole();
}

function startReveal() {
  if (allImpostorsThisRound) {
    screen.innerHTML = `
      <h1 style="color:#ff3333;">EVERYONE WAS AN IMPOSTOR!</h1>
      <p>All players received the impostor hint.</p>
      <p>Real word: <b>${escapeHTML(chosenPair.real)}</b></p>
      <p>Impostor hint: <b>${escapeHTML(chosenPair.impostor)}</b></p>
      <button onclick="playAgain()">Play Again</button>
    `;
    return;
  }

  if (doubleTroubleThisRound) {
    screen.innerHTML = `
      <h1 style="color:#ff3333;">DOUBLE TROUBLE!</h1>
      <p>The impostors were:</p>
      <h2>${escapeHTML(players[impostorIndices[0]])}</h2>
      <h2>${escapeHTML(players[impostorIndices[1]])}</h2>
      <p>Real word: <b>${escapeHTML(chosenPair.real)}</b></p>
      <p>Impostor hint: <b>${escapeHTML(chosenPair.impostor)}</b></p>
      <button onclick="playAgain()">Play Again</button>
    `;
    return;
  }

  screen.innerHTML = `
    <h1>The impostor was:</h1>
    <h2>${escapeHTML(players[impostorIndex])}</h2>
    <p>Real word: <b>${escapeHTML(chosenPair.real)}</b></p>
    <p>Impostor hint: <b>${escapeHTML(chosenPair.impostor)}</b></p>
    <button onclick="playAgain()">Play Again</button>
  `;
}

function playAgain() {
  currentPlayer = 0;
  chosenPair = null;
  impostorIndex = null;
  impostorIndices = [];
  starterPlayer = null;
  draggedPlayerIndex = null;
  allImpostorsThisRound = false;
  doubleTroubleThisRound = false;

  start();
}

start();

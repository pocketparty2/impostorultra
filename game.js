
let players = [];
let currentPlayer = 0;
let chosenPair = null;
let impostorIndex = null;
let starterPlayer = null;
let screen = document.getElementById("screen");

function start() {
  currentPlayer = 0;

  screen.innerHTML = `
    <h1>Word Impostor</h1>

    <div class="menuBox">
      <h2>Players</h2>
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
        <p id="playerError" style="color:#ff3333; font-weight:bold;"></p>
      </div>
    </div>

    <div class="menuBox">
      <h2>Word Packs</h2>
      <div id="equippedPacks"></div>
      <button id="managePacksBtn" onclick="togglePackDropdown()">Manage Word Packs</button>
      <div id="packDropdown"></div>
    </div>

    <button id="startBtn" onclick="beginGame()" style="margin-top:20px;">Start Game</button>
  `;

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
  players.splice(index, 1);
  updatePlayerList();
  updateStartButton();
}

function updatePlayerList() {
  const container = document.getElementById("playerList");

  container.innerHTML = players
    .map(
      (p, i) =>
        `<div class="playerBox">${escapeHTML(p)} <span class="removeBtn" onclick="removePlayer(${i})">✕</span></div>`
    )
    .join("");

  if (players.length === 0) {
    container.innerHTML = "<p>No players added yet</p>";
  }
}

function escapeHTML(text) {
  return text.replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function updateEquippedPacks() {
  const container = document.getElementById("equippedPacks");

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
  impostorIndex = Math.floor(Math.random() * players.length);
  currentPlayer = 0;

  showRole();
}

function showRole() {
  if (currentPlayer >= players.length) {
    starterPlayer = players[Math.floor(Math.random() * players.length)];

    screen.innerHTML = `
      <h1>All words assigned</h1>
      <p style="color:#ff3333; font-weight:bold;">
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
  const isImpostor = currentPlayer === impostorIndex;
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
  screen.innerHTML = `
    <h1>The impostor was:</h1>
    <h2>${escapeHTML(players[impostorIndex])}</h2>
    <p>Real word: <b>${escapeHTML(chosenPair.real)}</b></p>
    <p>Impostor hint: <b>${escapeHTML(chosenPair.impostor)}</b></p>

    <button onclick="start()">Play Again</button>
  `;
}

start();

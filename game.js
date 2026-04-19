let players = [];
let currentPlayer = 0;
let chosenPair = null;
let impostorIndex = null;
let screen = document.getElementById("screen");

function start() {
  currentPlayer = 0;

  screen.innerHTML = `
    <h1>Word Impostor</h1>

    <h2>Players</h2>
    <div id="playerList"></div>
    <button onclick="addPlayer()">Add Player</button>

    <h2>Word Packs</h2>
    <div id="packList"></div>

    <button id="startBtn" onclick="beginGame()" style="margin-top:20px;">Start Game</button>
  `;

  updatePlayerList();
  updatePackList();
  updateStartButton();
}

function addPlayer() {
  const name = prompt("Enter player name:");
  if (name && name.trim() !== "") {
    players.push(name.trim());
    updatePlayerList();
    updateStartButton();
  }
}

function updatePlayerList() {
  const list = players.map((p, i) => `<p>${i + 1}. ${p}</p>`).join("");
  document.getElementById("playerList").innerHTML = list || "<p>No players yet</p>";
}

function updatePackList() {
  const container = document.getElementById("packList");
  container.innerHTML = "";

  Object.keys(WORD_PACKS).forEach(pack => {
    const enabled = enabledPacks.includes(pack);
    const btn = document.createElement("button");

    btn.textContent = pack;
    btn.style.margin = "5px";
    btn.style.padding = "10px";
    btn.style.background = enabled ? "#4CAF50" : "#444";
    btn.style.color = "white";
    btn.style.border = "none";

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
  updatePackList();
}

function updateStartButton() {
  const btn = document.getElementById("startBtn");

  if (players.length < 3) {
    btn.disabled = true;
    btn.style.background = "#333";
    btn.textContent = "Insufficient players";
  } else {
    btn.disabled = false;
    btn.style.background = "#2196F3";
    btn.textContent = "Start Game";
  }
}

function beginGame() {
  if (enabledPacks.length === 0) {
    alert("Enable at least one word pack!");
    return;
  }

  const pool = enabledPacks.flatMap(pack => WORD_PACKS[pack]);
  chosenPair = pool[Math.floor(Math.random() * pool.length)];

  impostorIndex = Math.floor(Math.random() * players.length);
  currentPlayer = 0;

  showRole();
}

function showRole() {
  if (currentPlayer >= players.length) {
    screen.innerHTML = `
      <h1>All words assigned</h1>
      <p>Discuss and give clues!</p>
      <button onclick="startReveal()">Reveal Impostor</button>
    `;
    return;
  }

  screen.innerHTML = `
    <h1>${players[currentPlayer]}</h1>
    <button onclick="reveal()">Reveal Word</button>
  `;
}

function reveal() {
  const isImpostor = currentPlayer === impostorIndex;
  const word = isImpostor ? chosenPair.impostor : chosenPair.real;

  screen.innerHTML = `
    <h1>${players[currentPlayer]}</h1>
    ${
      isImpostor
        ? `<h2 style="color:#ff4444;">You are the IMPOSTOR!</h2>
           <p>Your word is only a <b>hint</b>.</p>`
        : `<p>Your word is:</p>`
    }
    <h2>${word}</h2>

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
    <h2>${players[impostorIndex]}</h2>
    <p>Real word: <b>${chosenPair.real}</b></p>
    <p>Impostor hint: <b>${chosenPair.impostor}</b></p>

    <button onclick="start()">Play Again</button>
  `;
}

start();

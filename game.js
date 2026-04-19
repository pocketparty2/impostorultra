let players = [];
let currentPlayer = 0;
let chosenPair = null;
let impostorIndex = null;
let screen = document.getElementById("screen");

function start() {
  players = [];
  currentPlayer = 0;

  screen.innerHTML = `
    <h1>Word Impostor</h1>
    <div id="playerList"></div>

    <button onclick="addPlayer()">Add Player</button>
    <button onclick="beginGame()" style="margin-top:10px;">Start Game</button>
  `;

  updatePlayerList();
}

function addPlayer() {
  const name = prompt("Enter player name:");
  if (name && name.trim() !== "") {
    players.push(name.trim());
    updatePlayerList();
  }
}

function updatePlayerList() {
  const list = players.map((p, i) => `<p>${i + 1}. ${p}</p>`).join("");
  document.getElementById("playerList").innerHTML = list || "<p>No players yet</p>";
}

function beginGame() {
  if (players.length < 3) {
    alert("You need at least 3 players!");
    return;
  }

  chosenPair = WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)];
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
        ? `<h2>You are the <span style="color:#ff4444;">IMPOSTOR</span>!</h2>
           <p>Your word is a <b>hint</b> related to the real word.</p>`
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

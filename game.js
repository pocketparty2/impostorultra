
let players = 0;
let currentPlayer = 1;
let chosenPair = null;
let impostorIndex = null;
let screen = document.getElementById("screen");

function start() {
  currentPlayer = 1;
  screen.innerHTML = `
    <h1>Word Impostor</h1>
    <p>How many players?</p>
    <input id="count" type="number" min="3" max="12">
    <button onclick="setPlayers()">Start</button>
  `;
}

function setPlayers() {
  players = parseInt(document.getElementById("count").value);

  chosenPair = WORD_PAIRS[Math.floor(Math.random() * WORD_PAIRS.length)];
  impostorIndex = Math.floor(Math.random() * players);

  showRole();
}

function showRole() {
  if (currentPlayer > players) {
    screen.innerHTML = `
      <h1>All words assigned</h1>
      <p>Discuss and give clues!</p>
      <button onclick="startReveal()">Reveal Impostor</button>
    `;
    return;
  }

  screen.innerHTML = `
    <h1>Player ${currentPlayer}</h1>
    <button onclick="reveal()">Reveal Word</button>
  `;
}

function reveal() {
  const isImpostor = currentPlayer - 1 === impostorIndex;
  const word = isImpostor ? chosenPair.impostor : chosenPair.real;

  screen.innerHTML = `
    <h1>Your word:</h1>
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
    <h2>Player ${impostorIndex + 1}</h2>
    <p>Real word: ${chosenPair.real}</p>
    <p>Impostor word: ${chosenPair.impostor}</p>
    <button onclick="start()">Play Again</button>
  `;
}

start();

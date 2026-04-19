const sets = [
  `;
}

function addPlayer() {
  names.push(`Player ${names.length + 1}`);
  saveNames();
  renderMenu();
}

function startGame() {
  const set = sets[Math.floor(Math.random() * sets.length)];
  const impostor = Math.floor(Math.random() * names.length);

  state.roles = names.map((name, i) => ({
    name,
    text: i === impostor
      ? `IMPOSTOR${state.hintOn ? `<br><br>Hint: ${set.hint}` : ""}`
      : set.word
  }));

  state.answer = {
    impostor: names[impostor],
    word: set.word,
    hint: set.hint
  };

  state.idx = 0;
  state.starter = names[Math.floor(Math.random() * names.length)];
  passPhone();
}

function passPhone() {
  if (state.idx >= state.roles.length) return endScreen();

  const player = state.roles[state.idx];

  document.getElementById("app").innerHTML = `
    <div class="card">
      <h2>Pass phone to ${player.name}</h2>
      <button onclick="revealRole()">Reveal</button>
    </div>
  `;
}

function revealRole() {
  const player = state.roles[state.idx];

  document.getElementById("app").innerHTML = `
    <div class="card">
      <h2>${player.name}</h2>
      <p>${player.text}</p>
      <button onclick="nextPlayer()">Next</button>
    </div>
  `;
}

function nextPlayer() {
  state.idx++;
  passPhone();
}

function endScreen() {
  document.getElementById("app").innerHTML = `
    <div class="card">
      <h2>${state.starter} starts the conversation!</h2>
      <button onclick="showResults()">Reveal Results</button>
      <button onclick="renderMenu()">New Game</button>
    </div>
  `;
}

function showResults() {
  document.getElementById("app").innerHTML = `
    <div class="card">
      <p><strong>Impostor:</strong> ${state.answer.impostor}</p>
      <p><strong>Word:</strong> ${state.answer.word}</p>
      <p><strong>Hint:</strong> ${state.answer.hint}</p>
      <button onclick="renderMenu()">Back</button>
    </div>
  `;
}

renderMenu();

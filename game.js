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

let playerStats = {};
let roundPlayers = [];
let roundImpostorIndices = [];
let roundAllImpostors = false;
let roundDoubleTrouble = false;
let roundOutcomeRecorded = false;
let statsExpanded = false;
let revealedImpostors = [];
let votingFinished = false;

let screen = document.getElementById("screen");

function ensurePlayerStats(name) {
  const key = name.trim().toLowerCase();

  if (!playerStats[key]) {
    playerStats[key] = {
      name: name,
      wins: 0,
      streak: 0
    };
  } else {
    playerStats[key].name = name;
  }
}

function start() {
  currentPlayer = 0;
  draggedPlayerIndex = null;

  players.forEach(ensurePlayerStats);

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
  ensurePlayerStats(name);

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

  players.forEach(ensurePlayerStats);

  roundPlayers = [...players];
  roundOutcomeRecorded = false;
  statsExpanded = false;
  revealedImpostors = [];
  votingFinished = false;

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

  roundImpostorIndices = [...impostorIndices];
  roundAllImpostors = allImpostorsThisRound;
  roundDoubleTrouble = doubleTroubleThisRound;

  currentPlayer = 0;
  showRole();
}

function showRole() {
  if (currentPlayer >= players.length) {
    starterPlayer = players[Math.floor(Math.random() * players.length)];
    showVotingScreen();
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

function showVotingScreen(message = "") {
  if (votingFinished) return;

  const voteButtons = roundPlayers.map((name, index) => {
    const alreadyRevealed = revealedImpostors.includes(index);

    return `
      <button
        onclick="castVote(${index})"
        ${alreadyRevealed ? "disabled" : ""}
        style="
          display:block;
          width:100%;
          margin:8px 0;
          ${alreadyRevealed
            ? "background:#bdbdbd;color:#555555;cursor:not-allowed;"
            : ""}
        "
      >
        ${escapeHTML(name)}${alreadyRevealed ? " - IMPOSTOR REVEALED" : ""}
      </button>
    `;
  }).join("");

  screen.innerHTML = `
    <h1>All words assigned</h1>

    <p style="color:#ff3333;font-weight:bold;">
      ${escapeHTML(starterPlayer)} starts the conversation!
    </p>

    <p>Discuss and give clues!</p>

    <div class="menuBox">
      <h2>Vote Out a Player</h2>
      <p>Who do you think is the impostor?</p>
      ${message ? `<p style="color:#ff3333;font-weight:bold;">${escapeHTML(message)}</p>` : ""}
      <div id="votingButtons">
        ${voteButtons}
      </div>
    </div>
  `;
}

function castVote(votedIndex) {
  if (votingFinished || roundOutcomeRecorded) return;
  if (votedIndex < 0 || votedIndex >= roundPlayers.length) return;
  if (revealedImpostors.includes(votedIndex)) return;

  const votedName = roundPlayers[votedIndex];
  const votedIsImpostor =
    roundAllImpostors || roundImpostorIndices.includes(votedIndex);

  if (roundAllImpostors) {
    const winners = roundPlayers.filter((_, index) => index !== votedIndex);

    recordWinners(
      winners,
      `${escapeHTML(votedName)} was voted out! Everyone else wins!`,
      `The voted-out player was ${escapeHTML(votedName)}.`
    );
    return;
  }

  if (roundDoubleTrouble) {
    if (votedIsImpostor) {
      revealedImpostors.push(votedIndex);

      if (revealedImpostors.length < roundImpostorIndices.length) {
        showVotingScreen(
          `${votedName} was an impostor! But there's another impostor still in the game. Vote again!`
        );
        return;
      }

      const winners = roundPlayers.filter(
        (_, index) => !roundImpostorIndices.includes(index)
      );

      recordWinners(
        winners,
        "Both impostors were discovered! The players win!",
        "Both impostors were voted out."
      );
      return;
    }

    const winners = roundImpostorIndices.map(index => roundPlayers[index]);

    recordWinners(
      winners,
      `${votedName} was a regular player! Both impostors win!`,
      `${votedName} was voted out, so both impostors win.`
    );
    return;
  }

  if (votedIsImpostor) {
    const winners = roundPlayers.filter(
      (_, index) => !roundImpostorIndices.includes(index)
    );

    recordWinners(
      winners,
      `${votedName} was the impostor! The players win!`,
      "The impostor was correctly identified."
    );
  } else {
    const winners = roundImpostorIndices.map(index => roundPlayers[index]);

    recordWinners(
      winners,
      `${votedName} was not the impostor! The impostor wins!`,
      `${votedName} was voted out instead of the impostor.`
    );
  }
}

function recordWinners(winners, headline, detail) {
  if (roundOutcomeRecorded) return;

  roundOutcomeRecorded = true;
  votingFinished = true;

  const winnerKeys = new Set(
    winners.map(name => name.trim().toLowerCase())
  );

  roundPlayers.forEach(name => {
    const key = name.trim().toLowerCase();
    ensurePlayerStats(name);

    if (winnerKeys.has(key)) {
      playerStats[key].wins++;
      playerStats[key].streak++;
    } else {
      playerStats[key].streak = 0;
    }
  });

  showResults(headline, detail, winners);
}

function showResults(headline, detail, winners) {
  let roleReveal = "";

  if (roundAllImpostors) {
    roleReveal = `
      <h2 style="color:#ff3333;">EVERYONE WAS AN IMPOSTOR!</h2>
      <p>All players received the impostor hint.</p>
    `;
  } else if (roundDoubleTrouble) {
    roleReveal = `
      <h2 style="color:#ff3333;">DOUBLE TROUBLE!</h2>
      <p>The impostors were:</p>
      <h2>${escapeHTML(roundPlayers[roundImpostorIndices[0]])}</h2>
      <h2>${escapeHTML(roundPlayers[roundImpostorIndices[1]])}</h2>
    `;
  } else {
    roleReveal = `
      <p>The impostor was:</p>
      <h2>${escapeHTML(roundPlayers[roundImpostorIndices[0]])}</h2>
    `;
  }

  screen.innerHTML = `
    <h1>${headline}</h1>

    ${roleReveal}

    <div class="menuBox">
      <h3>Round Results</h3>
      <p>${detail}</p>
      <p>Real word: <b>${escapeHTML(chosenPair.real)}</b></p>
      <p>Impostor hint: <b>${escapeHTML(chosenPair.impostor)}</b></p>
      <p><b>Winning side:</b> ${winners.map(escapeHTML).join(", ") || "Nobody"}</p>
    </div>

    <button
      id="statsToggleButton"
      onclick="toggleStats()"
      style="background:#888888;color:#ffffff;margin-top:12px;"
    >Stats &amp; Streaks!</button>

    <div
      id="statsPanel"
      class="menuBox"
      style="display:none;margin-top:12px;"
    >
      <h2>Stats &amp; Streaks</h2>
      <div id="statsTableContainer"></div>
    </div>

    <button onclick="playAgain()" style="margin-top:12px;">Play Again</button>
  `;

  updateStatsTable();
}

function toggleStats() {
  const panel = document.getElementById("statsPanel");
  const button = document.getElementById("statsToggleButton");

  if (!panel || !button) return;

  statsExpanded = !statsExpanded;
  panel.style.display = statsExpanded ? "block" : "none";
  button.textContent = statsExpanded
    ? "Hide Stats & Streaks"
    : "Stats & Streaks!";

  if (statsExpanded) {
    updateStatsTable();
  }
}

function updateStatsTable() {
  const container = document.getElementById("statsTableContainer");
  if (!container) return;

  const entries = Object.values(playerStats);

  if (entries.length === 0) {
    container.innerHTML = "<p>No stats yet!</p>";
    return;
  }

  entries.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.streak !== a.streak) return b.streak - a.streak;
    return a.name.localeCompare(b.name);
  });

  container.innerHTML = `
    <table style="width:100%;border-collapse:collapse;text-align:center;">
      <thead>
        <tr>
          <th style="padding:10px;border-bottom:2px solid #888;text-align:left;">Name</th>
          <th style="padding:10px;border-bottom:2px solid #888;">Wins</th>
          <th style="padding:10px;border-bottom:2px solid #888;">Streak</th>
        </tr>
      </thead>
      <tbody>
        ${entries.map(player => `
          <tr>
            <td style="padding:10px;border-bottom:1px solid #ddd;text-align:left;">
              ${escapeHTML(player.name)}
            </td>
            <td style="padding:10px;border-bottom:1px solid #ddd;">
              ${player.wins}
            </td>
            <td style="padding:10px;border-bottom:1px solid #ddd;">
              ${player.streak}
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
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

  roundPlayers = [];
  roundImpostorIndices = [];
  roundAllImpostors = false;
  roundDoubleTrouble = false;
  roundOutcomeRecorded = false;
  statsExpanded = false;
  revealedImpostors = [];
  votingFinished = false;

  start();
}

start();

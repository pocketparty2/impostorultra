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
let impostorHintsEnabled = true;
let jesterEnabled = false;
let bountyHunterEnabled = false;

let playerStats = {};
let roundPlayers = [];
let roundImpostorIndices = [];
let roundAllImpostors = false;
let roundDoubleTrouble = false;
let roundImpostorHintsEnabled = true;
let roundJesterIndex = null;
let roundJesterVotedOut = false;
let roundBountyHunterIndex = null;
let roundBountyTargetIndex = null;
let roundBountyHunterWon = false;
let roundOutcomeRecorded = false;
let statsExpanded = false;
let revealedImpostors = [];
let votingFinished = false;

let screen = document.getElementById("screen");

function ensurePlayerStats(name) {
  const key = name.trim().toLowerCase();

  if (!playerStats[key]) {
    playerStats[key] = { name, wins: 0, streak: 0 };
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
        <input type="text" id="playerNameInput"
          placeholder="Enter player name..." maxlength="30" autocomplete="off">
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

    <div class="menuBox" style="padding:14px;">
      <h2 style="margin:0 0 12px;">Game Settings</h2>

      <h3 style="margin:12px 0 6px;">Game Modes</h3>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:6px;">
        <label class="settingToggle">
          <input type="checkbox" id="allImpostorsToggle"
            ${allImpostorsMode ? "checked" : ""}>
          <span class="toggleSlider"></span>
          <span class="settingText">
            <strong>😈 Chaos Mode</strong>
            <small>25% chance: everyone is an impostor</small>
          </span>
        </label>

        <label class="settingToggle">
          <input type="checkbox" id="doubleTroubleToggle"
            ${doubleTroubleMode ? "checked" : ""}>
          <span class="toggleSlider"></span>
          <span class="settingText">
            <strong>👥 Double Trouble</strong>
            <small>25% chance: two impostors</small>
          </span>
        </label>
      </div>

      <h3 style="margin:12px 0 6px;">Impostor</h3>
      <label class="settingToggle">
        <input type="checkbox" id="impostorHintsToggle"
          ${impostorHintsEnabled ? "checked" : ""}>
        <span class="toggleSlider"></span>
        <span class="settingText">
          <strong>💡 Impostor Hints</strong>
          <small>Give impostors a related word instead of no hint</small>
        </span>
      </label>

      <h3 style="margin:12px 0 6px;">Special Roles</h3>
      <p style="margin:0 0 8px;font-size:0.9rem;">Roles are optional and can be enabled independently.</p>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:6px;">
        <div>
          <h4 style="margin:4px 0;">🟢 Non-Impostor</h4>
          <label class="settingToggle">
            <input type="checkbox" id="jesterToggle"
              ${jesterEnabled ? "checked" : ""}>
            <span class="toggleSlider"></span>
            <span class="settingText">
              <strong>🎭 Jester</strong>
              <small>Knows the real word; wins if voted out</small>
            </span>
          </label>
        </div>

        <div>
          <h4 style="margin:4px 0;">🔴 Impostor</h4>
          <p style="font-size:0.85rem;margin:4px 0;">No roles available yet.</p>
        </div>

        <div>
          <h4 style="margin:4px 0;">🟣 Both</h4>
          <label class="settingToggle">
            <input type="checkbox" id="bountyHunterToggle"
              ${bountyHunterEnabled ? "checked" : ""}>
            <span class="toggleSlider"></span>
            <span class="settingText">
              <strong>🎯 Bounty Hunter</strong>
              <small>Wins if their secret target is voted out</small>
            </span>
          </label>
        </div>
      </div>
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

  document.getElementById("impostorHintsToggle").addEventListener("change", event => {
    impostorHintsEnabled = event.target.checked;
  });

  document.getElementById("jesterToggle").addEventListener("change", event => {
    jesterEnabled = event.target.checked;
  });

  document.getElementById("bountyHunterToggle").addEventListener("change", event => {
    bountyHunterEnabled = event.target.checked;
  });

  updatePlayerList();
  updateEquippedPacks();
  buildPackDropdown();
  updateStartButton();

  document.getElementById("playerNameInput").addEventListener("keydown", event => {
    if (event.key === "Enter") addPlayer();
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

  container.innerHTML = players.map((p, i) => `
    <div class="playerBox" data-index="${i}">
      <span class="dragHandle" title="Drag to reorder"
        aria-label="Drag to reorder" draggable="true">⠿</span>
      <span class="playerName">${escapeHTML(p)}</span>
      <span class="removeBtn" data-remove="${i}" title="Remove player">✕</span>
    </div>
  `).join("");

  if (players.length === 0) {
    container.innerHTML = "<p>No players added yet</p>";
    return;
  }

  container.querySelectorAll(".removeBtn").forEach(button => {
    button.addEventListener("click", () => removePlayer(Number(button.dataset.remove)));
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
      container.querySelectorAll(".playerBox").forEach(box => box.classList.remove("dragging"));
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

      if (fromIndex === null || fromIndex < 0 ||
          fromIndex >= players.length || fromIndex === toIndex) return;

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

  container.innerHTML = enabledPacks.length
    ? enabledPacks.map(pack => `<div class="packBox">${escapeHTML(pack)}</div>`).join("")
    : "<p>No packs enabled</p>";
}

function togglePackDropdown() {
  const panel = document.getElementById("packDropdown");
  panel.style.display = panel.style.display === "none" ? "block" : "none";
}

function buildPackDropdown() {
  const container = document.getElementById("packDropdown");
  container.innerHTML = "";

  Object.keys(WORD_PACKS).forEach(pack => {
    const btn = document.createElement("button");
    btn.textContent = pack;
    btn.className = enabledPacks.includes(pack) ? "" : "disabledPack";
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
    btn.textContent = `Need ${3 - players.length} more player${players.length === 2 ? "" : "s"}`;
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
  roundImpostorHintsEnabled = impostorHintsEnabled;

  roundJesterIndex = null;
  roundJesterVotedOut = false;
  roundBountyHunterIndex = null;
  roundBountyTargetIndex = null;
  roundBountyHunterWon = false;

  chosenPair = pool[Math.floor(Math.random() * pool.length)];

  allImpostorsThisRound = allImpostorsMode && Math.random() < 0.25;
  doubleTroubleThisRound = !allImpostorsThisRound &&
    doubleTroubleMode && Math.random() < 0.25;

  impostorIndices = [];

  if (allImpostorsThisRound) {
    impostorIndex = null;
  } else if (doubleTroubleThisRound) {
    const shuffledIndices = players.map((_, index) => index);

    for (let i = shuffledIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]];
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

  assignSpecialRoles();

  currentPlayer = 0;
  showRole();
}

function showRole() {
  if (currentPlayer >= roundPlayers.length) {
    starterPlayer = roundPlayers[Math.floor(Math.random() * roundPlayers.length)];
    showVotingScreen();
    return;
  }

  screen.innerHTML = `
    <div class="menuBox" style="max-width:500px;margin:20px auto;text-align:center;">
      <h1>${escapeHTML(roundPlayers[currentPlayer])}</h1>
      <p>Pass the device to this player, then reveal their role.</p>
      <button onclick="reveal()">Reveal Role</button>
    </div>
  `;
}

function reveal() {
  const isImpostor = roundAllImpostors ||
    roundImpostorIndices.includes(currentPlayer);
  const isJester = roundJesterIndex === currentPlayer;
  const isBountyHunter = roundBountyHunterIndex === currentPlayer;

  const teamName = isImpostor ? "IMPOSTOR" : "INNOCENT";
  const teamColor = isImpostor ? ROLE_COLORS.impostor : ROLE_COLORS.innocent;

  const specificRoles = [];
  if (isJester) specificRoles.push("Jester");
  if (isBountyHunter) specificRoles.push("Bounty Hunter");
  const specificRoleText = specificRoles.length
    ? specificRoles.join(" + ")
    : "None";

  let wordLabel = "REAL WORD";
  let wordContent = escapeHTML(chosenPair.real);

  if (isImpostor) {
    if (roundImpostorHintsEnabled) {
      wordLabel = "IMPOSTOR HINT";
      wordContent = escapeHTML(chosenPair.impostor);
    } else {
      wordLabel = "WORD";
      wordContent = "No hint enabled";
    }
  }

  let mainObjective;

  if (roundAllImpostors) {
    mainObjective = "Avoid being voted out to win!";
  } else if (isImpostor) {
    mainObjective = "Blend in with the innocents and avoid being voted out!";
  } else {
    mainObjective = "Find and vote out the impostor to win!";
  }

  const extraObjectives = getSpecialObjectives(isJester, isBountyHunter);

  screen.innerHTML = `
    <div class="menuBox" style="max-width:500px;margin:20px auto;text-align:center;padding:20px;">
      <p style="margin:0 0 6px;font-size:0.85rem;letter-spacing:2px;">YOUR TEAM</p>
      <h1 style="margin:0 0 10px;color:${teamColor};">${teamName}</h1>
      <p style="margin:0 0 20px;font-size:0.95rem;">Specific Role: <strong>${escapeHTML(specificRoleText)}</strong></p>

      <div style="background:#f3f3f3;color:#111;border-radius:12px;padding:16px;margin-bottom:12px;">
        <p style="font-size:0.8rem;font-weight:bold;letter-spacing:1px;margin:0 0 8px;">${wordLabel}</p>
        <h2 style="margin:0;overflow-wrap:anywhere;">${wordContent}</h2>
      </div>

      <div style="border:1px solid #ccc;border-radius:12px;padding:14px;margin-bottom:18px;text-align:left;">
        <h3 style="margin:0 0 12px;text-align:center;">Your Objective</h3>
        <p style="margin:0;">${mainObjective}</p>
        ${extraObjectives.map(objective => `
          <div style="margin-top:12px;padding:10px;border:1px solid ${objective.color};border-radius:8px;">
            <p style="margin:0 0 5px;color:${objective.color};font-weight:bold;font-size:0.85rem;letter-spacing:0.3px;">★ ${objective.title}</p>
            <p style="margin:0;">${objective.text}</p>
          </div>
        `).join("")}
      </div>

      <button onclick="nextPlayer()">Hide &amp; Pass Device</button>
    </div>
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
      <button onclick="castVote(${index})" ${alreadyRevealed ? "disabled" : ""}
        style="display:block;width:100%;margin:8px 0;${alreadyRevealed
          ? "background:#bdbdbd;color:#555;cursor:not-allowed;" : ""}">
        ${escapeHTML(name)}${alreadyRevealed ? " - IMPOSTOR REVEALED" : ""}
      </button>
    `;
  }).join("");

  screen.innerHTML = `
    <h1>All Words Assigned</h1>

    <div class="menuBox" style="text-align:center;">
      <h2>Discussion Time</h2>
      <p><b style="color:#ff3333;">${escapeHTML(starterPlayer)}</b> starts the conversation!</p>
      <p>Discuss your words, give clues, and figure out who's bluffing.</p>
    </div>

    <div class="menuBox" style="margin-top:20px;">
      <h2>🗳️ Vote Out a Player</h2>
      <p>Select the person the group voted for.</p>
      ${message ? `<p style="color:#ff3333;font-weight:bold;">${escapeHTML(message)}</p>` : ""}
      <div id="votingButtons">${voteButtons}</div>
    </div>
  `;
}

function castVote(votedIndex) {
  if (votingFinished || roundOutcomeRecorded) return;
  if (votedIndex < 0 || votedIndex >= roundPlayers.length) return;
  if (revealedImpostors.includes(votedIndex)) return;

  const votedName = roundPlayers[votedIndex];
  const votedIsImpostor = roundAllImpostors ||
    roundImpostorIndices.includes(votedIndex);
  const votedJester = roundJesterIndex === votedIndex;

  handleSpecialRoleVote(votedIndex);

  if (roundAllImpostors) {
    const winners = roundPlayers.filter((_, index) => index !== votedIndex);

    recordWinners(
      winners,
      `${votedName} was voted out!`,
      "Everyone except the voted-out player wins."
    );
    return;
  }

  if (roundDoubleTrouble) {
    if (votedIsImpostor) {
      revealedImpostors.push(votedIndex);

      if (revealedImpostors.length < roundImpostorIndices.length) {
        showVotingScreen(
          `${votedName} was an impostor! There's another impostor still in the game. Vote again!`
        );
        return;
      }

      const winners = roundPlayers.filter(
        (_, index) => !roundImpostorIndices.includes(index)
      );

      recordWinners(
        winners,
        "Both impostors were discovered!",
        "The players win!"
      );
      return;
    }

    const winners = roundImpostorIndices.map(index => roundPlayers[index]);

    if (votedJester) {
      winners.push(votedName);

      recordWinners(
        winners,
        `${votedName} was a regular player! The Jester wins!`,
        "Both impostors and the Jester win!"
      );
    } else {
      recordWinners(
        winners,
        `${votedName} was a regular player!`,
        "Both impostors win!"
      );
    }

    return;
  }

  if (votedIsImpostor) {
    const winners = roundPlayers.filter(
      (_, index) => !roundImpostorIndices.includes(index)
    );

    recordWinners(
      winners,
      `${votedName} was the impostor!`,
      "The players win!"
    );
  } else {
    const winners = roundImpostorIndices.map(index => roundPlayers[index]);

    if (votedJester) {
      winners.push(votedName);

      recordWinners(
        winners,
        `${votedName} was not the impostor! The Jester wins!`,
        "The impostor and the Jester win!"
      );
    } else {
      recordWinners(
        winners,
        `${votedName} was not the impostor!`,
        "The impostor wins!"
      );
    }
  }
}

function recordWinners(winners, headline, detail) {
  if (roundOutcomeRecorded) return;

  winners = applySpecialRoleWinners(winners);

  roundOutcomeRecorded = true;
  votingFinished = true;

  const winnerKeys = new Set(winners.map(name => name.trim().toLowerCase()));

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
      <div class="menuBox" style="border:2px solid #ff3333;text-align:center;">
        <h2 style="color:#ff3333;margin-top:0;">😈 CHAOS MODE</h2>
        <p>Everyone was an impostor!</p>
      </div>
    `;
  } else if (roundDoubleTrouble) {
    roleReveal = `
      <div class="menuBox" style="border:2px solid #ff3333;text-align:center;">
        <h2 style="color:#ff3333;margin-top:0;">👥 DOUBLE TROUBLE</h2>
        <p>The impostors were:</p>
        <h2>${escapeHTML(roundPlayers[roundImpostorIndices[0]])}</h2>
        <h2>${escapeHTML(roundPlayers[roundImpostorIndices[1]])}</h2>
      </div>
    `;
  } else {
    roleReveal = `
      <div class="menuBox" style="border:2px solid #ff3333;text-align:center;">
        <h2 style="color:#ff3333;margin-top:0;">🕵️ THE IMPOSTOR</h2>
        <h2>${escapeHTML(roundPlayers[roundImpostorIndices[0]])}</h2>
      </div>
    `;
  }

  const { jesterReveal, bountyHunterReveal } = buildSpecialRoleResults(winners);

  screen.innerHTML = `
    <div style="text-align:center;margin:10px 0 24px;">
      <p style="font-size:0.9rem;font-weight:bold;letter-spacing:2px;margin-bottom:8px;">
        ROUND OVER
      </p>
      <h1 style="font-size:2rem;margin:0 0 12px;">${escapeHTML(headline)}</h1>
      <p style="font-size:1.05rem;margin:0;">${escapeHTML(detail)}</p>
    </div>

    ${roleReveal}
    ${jesterReveal}
    ${bountyHunterReveal}

    <div class="menuBox" style="margin-top:16px;text-align:center;">
      <h2 style="margin-top:0;">📝 The Words</h2>
      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        <div style="flex:1;min-width:120px;background:#f0f0f0;padding:14px;border-radius:10px;">
          <p style="margin:0 0 6px;font-size:0.8rem;color:#555;">REAL WORD</p>
          <h3 style="margin:0;">${escapeHTML(chosenPair.real)}</h3>
        </div>
        <div style="flex:1;min-width:120px;background:#ffe5e5;padding:14px;border-radius:10px;">
          <p style="margin:0 0 6px;font-size:0.8rem;color:#a00;">IMPOSTOR HINT</p>
          <h3 style="margin:0;">${escapeHTML(chosenPair.impostor)}</h3>
        </div>
      </div>
    </div>

    <div class="menuBox" style="margin-top:16px;text-align:center;">
      <h2 style="margin-top:0;">🏆 Winning Players</h2>
      <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px;">
        ${winners.length
          ? winners.map(name => `
              <span style="display:inline-block;background:#ccff33;color:#000;padding:8px 12px;border-radius:20px;font-weight:bold;">
                ${escapeHTML(name)}
              </span>
            `).join("")
          : "<p>Nobody won this round.</p>"}
      </div>
    </div>

    <div style="margin:24px auto 0;max-width:100%;text-align:center;">
      <button id="statsToggleButton" onclick="toggleStats()"
        style="display:block;width:50%;min-width:150px;margin:0 auto 12px;background:#888;color:#fff;font-size:0.8rem;padding:8px 10px;">
        Stats &amp; Streaks
      </button>

      <div id="statsPanel" class="menuBox"
        style="display:none;margin:0 0 16px;text-align:left;">
        <h2 style="text-align:center;">Stats &amp; Streaks</h2>
        <div id="statsTableContainer"></div>
      </div>

      <button onclick="playAgain()"
        style="display:block;width:100%;max-width:400px;margin:0 auto;font-size:1.1rem;padding:16px;">
        Play Again
      </button>
    </div>
  `;

  updateStatsTable();
}

function toggleStats() {
  const panel = document.getElementById("statsPanel");
  const button = document.getElementById("statsToggleButton");

  if (!panel || !button) return;

  statsExpanded = !statsExpanded;
  panel.style.display = statsExpanded ? "block" : "none";
  button.textContent = statsExpanded ? "Hide Stats & Streaks" : "Stats & Streaks";

  if (statsExpanded) updateStatsTable();
}

function updateStatsTable() {
  const container = document.getElementById("statsTableContainer");
  if (!container) return;

  const entries = Object.values(playerStats);

  if (entries.length === 0) {
    container.innerHTML = "<p>No stats yet!</p>";
    return;
  }

  entries.sort((a, b) =>
    b.wins - a.wins ||
    b.streak - a.streak ||
    a.name.localeCompare(b.name)
  );

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
            <td style="padding:10px;border-bottom:1px solid #ddd;">${player.wins}</td>
            <td style="padding:10px;border-bottom:1px solid #ddd;">${player.streak}</td>
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
  roundJesterIndex = null;
  roundJesterVotedOut = false;
  roundBountyHunterIndex = null;
  roundBountyTargetIndex = null;
  roundBountyHunterWon = false;
  roundOutcomeRecorded = false;
  statsExpanded = false;
  revealedImpostors = [];
  votingFinished = false;

  start();
}

start();

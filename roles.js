
const ROLE_COLORS = {
  innocent: "#55dd77",
  impostor: "#ff3333",
  jester: "#cc9900",
  bountyHunter: "#7b61ff"
};

function assignSpecialRoles() {
  roundJesterIndex = null;
  roundJesterVotedOut = false;
  roundBountyHunterIndex = null;
  roundBountyTargetIndex = null;
  roundBountyHunterWon = false;

  if (jesterEnabled && !roundAllImpostors) {
    const eligiblePlayers = roundPlayers
      .map((_, index) => index)
      .filter(index => !roundImpostorIndices.includes(index));

    if (eligiblePlayers.length > 0) {
      roundJesterIndex = eligiblePlayers[
        Math.floor(Math.random() * eligiblePlayers.length)
      ];
    }
  }

  if (bountyHunterEnabled) {
    roundBountyHunterIndex = Math.floor(Math.random() * roundPlayers.length);

    const possibleTargets = roundPlayers
      .map((_, index) => index)
      .filter(index => index !== roundBountyHunterIndex);

    roundBountyTargetIndex = possibleTargets[
      Math.floor(Math.random() * possibleTargets.length)
    ];
  }
}

function getSpecialObjectives(isJester, isBountyHunter) {
  const objectives = [];

  if (isJester) {
    objectives.push({
      title: "EXTRA OBJECTIVE: JESTER",
      text: "Get voted out to win!",
      color: ROLE_COLORS.jester
    });
  }

  if (isBountyHunter) {
    objectives.push({
      title: "EXTRA OBJECTIVE: BOUNTY HUNTER",
      text: `Your secret target is <strong>${escapeHTML(roundPlayers[roundBountyTargetIndex])}</strong>. Get them voted out to win, regardless of your team's result!`,
      color: ROLE_COLORS.bountyHunter
    });
  }

  return objectives;
}

function handleSpecialRoleVote(votedIndex) {
  if (roundBountyTargetIndex === votedIndex) {
    roundBountyHunterWon = true;
  }

  if (roundJesterIndex === votedIndex) {
    roundJesterVotedOut = true;
  }
}

function applySpecialRoleWinners(winners) {
  let finalWinners = [...winners];

  if (roundJesterIndex !== null && !roundJesterVotedOut) {
    const jesterName = roundPlayers[roundJesterIndex];

    finalWinners = finalWinners.filter(
      name => name.trim().toLowerCase() !== jesterName.trim().toLowerCase()
    );
  }

  if (roundBountyHunterWon && roundBountyHunterIndex !== null) {
    const bountyHunterName = roundPlayers[roundBountyHunterIndex];

    const alreadyWinner = finalWinners.some(
      name => name.trim().toLowerCase() === bountyHunterName.trim().toLowerCase()
    );

    if (!alreadyWinner) {
      finalWinners.push(bountyHunterName);
    }
  }

  return finalWinners;
}

function buildSpecialRoleResults(winners) {
  let jesterReveal = "";
  let bountyHunterReveal = "";

  if (roundJesterIndex !== null) {
    const jesterName = roundPlayers[roundJesterIndex];

    const jesterWon = winners.some(
      name => name.trim().toLowerCase() === jesterName.trim().toLowerCase()
    );

    jesterReveal = `
      <div class="menuBox" style="border:2px solid ${ROLE_COLORS.jester};text-align:center;margin-top:16px;">
        <h2 style="color:${ROLE_COLORS.jester};margin-top:0;">🎭 THE JESTER</h2>
        <h2>${escapeHTML(jesterName)}</h2>
        <p>${jesterWon
          ? "The Jester achieved their objective and won!"
          : "The Jester did not get voted out."}</p>
      </div>
    `;
  }

  if (roundBountyHunterIndex !== null) {
    const bountyHunterName = roundPlayers[roundBountyHunterIndex];
    const bountyTargetName = roundPlayers[roundBountyTargetIndex];

    bountyHunterReveal = `
      <div class="menuBox" style="border:2px solid ${ROLE_COLORS.bountyHunter};text-align:center;margin-top:16px;">
        <h2 style="color:${ROLE_COLORS.bountyHunter};margin-top:0;">🎯 THE BOUNTY HUNTER</h2>
        <h2>${escapeHTML(bountyHunterName)}</h2>
        <p>Their target was <strong>${escapeHTML(bountyTargetName)}</strong>.</p>
        <p>${roundBountyHunterWon
          ? "The target was voted out! The Bounty Hunter achieved their objective!"
          : "The target survived the vote. The Bounty Hunter did not achieve their objective."}</p>
      </div>
    `;
  }

  return { jesterReveal, bountyHunterReveal };
}

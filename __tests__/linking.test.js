/**
 * Tests for coach-player linking business logic.
 * Uses pure JS mocks — no Firebase or React Native required.
 */

// ── Helpers replicated from source ────────────────────────────────────────────

function sanitizeEmail(email) {
  return email.replace(/[.#$[\]]/g, '_');
}

function evalDotColor(lastEvalDate) {
  if (!lastEvalDate) return '#F44336';
  const diff = (Date.now() - new Date(lastEvalDate).getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 1) return '#4CAF50';
  if (diff <= 7) return '#FF9800';
  return '#F44336';
}

function fmtDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function filterRoster(allDocs) {
  const pendingInvites = allDocs.filter((p) => p.invited);
  const players = allDocs.filter((p) => !p.invited);
  return { players, pendingInvites };
}

function canSwitchRole(role, isAdmin) {
  return role === 'coach' || isAdmin === true;
}

function switchRoleGuard(role, isAdmin) {
  if (role !== 'coach' && !isAdmin) return { allowed: false, reason: 'Access Restricted' };
  return { allowed: true, newRole: role === 'coach' ? 'player' : 'coach' };
}

function verifyCoachCode(input, storedCode, defaultCode = 'BACECAMP-COACH') {
  const code = storedCode || defaultCode;
  return input.trim() === code;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Email sanitization', () => {
  test('replaces dots with underscores', () => {
    expect(sanitizeEmail('user.name@example.com')).toBe('user_name@example_com');
  });
  test('replaces # with underscore', () => {
    expect(sanitizeEmail('user#tag@host.com')).toBe('user_tag@host_com');
  });
  test('replaces $ with underscore', () => {
    expect(sanitizeEmail('price$@host.com')).toBe('price_@host_com');
  });
  test('replaces [ and ] with underscore', () => {
    expect(sanitizeEmail('a[b]@host.com')).toBe('a_b_@host_com');
  });
  test('leaves normal emails unchanged except dots', () => {
    expect(sanitizeEmail('alexis@bacecamp.com')).toBe('alexis@bacecamp_com');
  });
  test('matches what linkingService would produce', () => {
    const email = 'player.test@gmail.com';
    expect(sanitizeEmail(email)).toBe('player_test@gmail_com');
  });
});

describe('Roster filtering (active vs pending)', () => {
  const mockRoster = [
    { id: 'alice_gmail_com', email: 'alice@gmail.com', name: 'Alice', invited: false, uid: 'uid-alice' },
    { id: 'bob_gmail_com',   email: 'bob@gmail.com',   name: 'bob@gmail.com', invited: true },
    { id: 'carol_gmail_com', email: 'carol@gmail.com', name: 'carol@gmail.com', invited: true },
    { id: 'dave_gmail_com',  email: 'dave@gmail.com',  name: 'Dave', invited: false, uid: 'uid-dave' },
  ];

  test('active players have invited=false', () => {
    const { players } = filterRoster(mockRoster);
    expect(players).toHaveLength(2);
    expect(players.every(p => !p.invited)).toBe(true);
  });

  test('pending invites have invited=true', () => {
    const { pendingInvites } = filterRoster(mockRoster);
    expect(pendingInvites).toHaveLength(2);
    expect(pendingInvites.every(p => p.invited)).toBe(true);
  });

  test('playerCount only counts active (not pending)', () => {
    const { players } = filterRoster(mockRoster);
    expect(players.length).toBe(2); // not 4
  });

  test('empty roster returns empty arrays', () => {
    const { players, pendingInvites } = filterRoster([]);
    expect(players).toHaveLength(0);
    expect(pendingInvites).toHaveLength(0);
  });

  test('all active roster', () => {
    const allActive = mockRoster.map(p => ({ ...p, invited: false, uid: 'uid-x' }));
    const { players, pendingInvites } = filterRoster(allActive);
    expect(players).toHaveLength(4);
    expect(pendingInvites).toHaveLength(0);
  });
});

describe('evalDotColor (last evaluation freshness)', () => {
  test('returns red for no eval date', () => {
    expect(evalDotColor(null)).toBe('#F44336');
    expect(evalDotColor(undefined)).toBe('#F44336');
  });

  test('returns green for eval today', () => {
    const today = new Date().toISOString();
    expect(evalDotColor(today)).toBe('#4CAF50');
  });

  test('returns orange for eval 3 days ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(evalDotColor(threeDaysAgo)).toBe('#FF9800');
  });

  test('returns red for eval 10 days ago', () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    expect(evalDotColor(tenDaysAgo)).toBe('#F44336');
  });
});

describe('Role switching guards', () => {
  test('coach can switch roles', () => {
    expect(canSwitchRole('coach', false)).toBe(true);
  });

  test('admin can switch roles even as player', () => {
    expect(canSwitchRole('player', true)).toBe(true);
  });

  test('regular player cannot switch roles', () => {
    expect(canSwitchRole('player', false)).toBe(false);
  });

  test('coach switches to player', () => {
    const result = switchRoleGuard('coach', false);
    expect(result.allowed).toBe(true);
    expect(result.newRole).toBe('player');
  });

  test('admin in player mode switches back to coach', () => {
    const result = switchRoleGuard('player', true);
    expect(result.allowed).toBe(true);
    expect(result.newRole).toBe('coach');
  });

  test('player blocked from switching (not admin)', () => {
    const result = switchRoleGuard('player', false);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('Access Restricted');
  });

  test('isAdmin=undefined treated as falsy', () => {
    expect(canSwitchRole('player', undefined)).toBe(false);
  });
});

describe('Coach access code verification', () => {
  test('correct Firestore code accepted', () => {
    expect(verifyCoachCode('MYCODE', 'MYCODE')).toBe(true);
  });

  test('wrong code rejected', () => {
    expect(verifyCoachCode('WRONGCODE', 'MYCODE')).toBe(false);
  });

  test('falls back to default code when Firestore unavailable', () => {
    expect(verifyCoachCode('BACECAMP-COACH', null)).toBe(true);
    expect(verifyCoachCode('BACECAMP-COACH', undefined)).toBe(true);
  });

  test('wrong default code rejected', () => {
    expect(verifyCoachCode('NOTTHECODE', null)).toBe(false);
  });

  test('code comparison is case-sensitive', () => {
    expect(verifyCoachCode('bacecamp-coach', 'BACECAMP-COACH')).toBe(false);
  });

  test('leading/trailing spaces trimmed', () => {
    expect(verifyCoachCode('  BACECAMP-COACH  ', null)).toBe(true);
  });
});

describe('linkingService batch integrity', () => {
  // Simulate the batch writes — no playerCoach write should be present
  function buildPlayerBatch(user, coachUid) {
    const sanitized = sanitizeEmail(user.email);
    const writes = [];
    // Write 1: roster update
    writes.push({ collection: 'playerRosters', path: `${coachUid}/players/${sanitized}`, data: { uid: user.uid, invited: false } });
    // Write 2: user profile
    writes.push({ collection: 'users', path: user.uid, data: { coachUid } });
    // Write 3: linkRequest status
    writes.push({ collection: 'linkRequests', path: 'requestId', data: { status: 'accepted', playerUid: user.uid } });
    // Critically: NO playerCoach write here
    return writes;
  }

  test('batch does NOT write to playerCoach collection', () => {
    const user = { uid: 'player-uid', email: 'player@test.com', displayName: 'Test Player' };
    const writes = buildPlayerBatch(user, 'coach-uid');
    const playerCoachWrites = writes.filter(w => w.collection === 'playerCoach');
    expect(playerCoachWrites).toHaveLength(0);
  });

  test('batch writes exactly 3 documents', () => {
    const user = { uid: 'player-uid', email: 'player@test.com', displayName: 'Test Player' };
    const writes = buildPlayerBatch(user, 'coach-uid');
    expect(writes).toHaveLength(3);
  });

  test('roster write sets invited to false', () => {
    const user = { uid: 'player-uid', email: 'player@test.com' };
    const writes = buildPlayerBatch(user, 'coach-uid');
    const rosterWrite = writes.find(w => w.collection === 'playerRosters');
    expect(rosterWrite.data.invited).toBe(false);
  });

  test('roster write includes player UID', () => {
    const user = { uid: 'player-uid', email: 'player@test.com' };
    const writes = buildPlayerBatch(user, 'coach-uid');
    const rosterWrite = writes.find(w => w.collection === 'playerRosters');
    expect(rosterWrite.data.uid).toBe('player-uid');
  });

  test('linkRequest is marked accepted', () => {
    const user = { uid: 'player-uid', email: 'player@test.com' };
    const writes = buildPlayerBatch(user, 'coach-uid');
    const linkReqWrite = writes.find(w => w.collection === 'linkRequests');
    expect(linkReqWrite.data.status).toBe('accepted');
  });

  test('coachUid stored on player profile', () => {
    const user = { uid: 'player-uid', email: 'player@test.com' };
    const writes = buildPlayerBatch(user, 'coach-uid-123');
    const userWrite = writes.find(w => w.collection === 'users');
    expect(userWrite.data.coachUid).toBe('coach-uid-123');
  });
});

describe('sendInvite batch integrity (coach side)', () => {
  function buildInviteBatch(coachUid, playerEmail) {
    const sanitized = sanitizeEmail(playerEmail);
    const writes = [];
    // linkRequests
    writes.push({ collection: 'linkRequests', data: { coachUid, playerEmail, status: 'pending' } });
    // playerRosters entry with invited=true
    writes.push({ collection: 'playerRosters', path: `${coachUid}/players/${sanitized}`, data: { email: playerEmail, invited: true } });
    // playerCoach — coach CAN write this (has isCoach() permission)
    writes.push({ collection: 'playerCoach', path: sanitized, data: { coachUid } });
    return writes;
  }

  test('invite batch writes to playerCoach (coach has permission)', () => {
    const writes = buildInviteBatch('coach-uid', 'player@test.com');
    const pc = writes.find(w => w.collection === 'playerCoach');
    expect(pc).toBeDefined();
    expect(pc.data.coachUid).toBe('coach-uid');
  });

  test('invite creates pending roster entry', () => {
    const writes = buildInviteBatch('coach-uid', 'player@test.com');
    const roster = writes.find(w => w.collection === 'playerRosters');
    expect(roster.data.invited).toBe(true);
  });

  test('invite creates linkRequest with pending status', () => {
    const writes = buildInviteBatch('coach-uid', 'player@test.com');
    const lr = writes.find(w => w.collection === 'linkRequests');
    expect(lr.data.status).toBe('pending');
    expect(lr.data.playerEmail).toBe('player@test.com');
  });

  test('sanitized email used as roster doc ID', () => {
    const writes = buildInviteBatch('coach-uid', 'player.name@test.com');
    const roster = writes.find(w => w.collection === 'playerRosters');
    expect(roster.path).toContain('player_name@test_com');
  });
});

// ── New: roster join-code flow ─────────────────────────────────────────────────

describe('generateCode (roster join code)', () => {
  // Replicate the logic from CoachRosterScreen
  function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  test('generates a 6-character string', () => {
    for (let i = 0; i < 20; i++) {
      expect(generateCode()).toHaveLength(6);
    }
  });

  test('only uses allowed characters (no 0, O, 1, I)', () => {
    const forbidden = /[01OI]/;
    for (let i = 0; i < 100; i++) {
      expect(generateCode()).not.toMatch(forbidden);
    }
  });

  test('generates uppercase only', () => {
    for (let i = 0; i < 20; i++) {
      const code = generateCode();
      expect(code).toBe(code.toUpperCase());
    }
  });

  test('two successive calls are unlikely to collide', () => {
    const seen = new Set();
    for (let i = 0; i < 1000; i++) seen.add(generateCode());
    // With 32^6 ≈ 1B possibilities, 1000 codes should all be unique
    expect(seen.size).toBe(1000);
  });
});

describe('joinCoach batch (player-initiated join via roster code)', () => {
  function buildJoinBatch(user, coachUid, coachName) {
    const sanitized = sanitizeEmail(user.email);
    const writes = [];
    // Write 1: create roster entry as active player
    writes.push({
      collection: 'playerRosters',
      path: `${coachUid}/players/${sanitized}`,
      data: { uid: user.uid, name: user.displayName || user.email, email: user.email, invited: false },
    });
    // Write 2: store coachUid + coachName on player profile
    writes.push({
      collection: 'users',
      path: user.uid,
      data: { coachUid, coachName: coachName || '' },
    });
    // Write 3: linkRequest audit record (playerInitiated: true)
    writes.push({
      collection: 'linkRequests',
      path: `${user.uid}-${coachUid}`,
      data: { coachUid, playerEmail: user.email, playerUid: user.uid, status: 'accepted', playerInitiated: true },
    });
    return writes;
  }

  test('batch writes exactly 3 documents', () => {
    const user = { uid: 'p-uid', email: 'player@test.com', displayName: 'Test Player' };
    expect(buildJoinBatch(user, 'c-uid', 'Coach Name')).toHaveLength(3);
  });

  test('roster entry is active (invited=false)', () => {
    const user = { uid: 'p-uid', email: 'player@test.com' };
    const writes = buildJoinBatch(user, 'c-uid', 'Coach');
    const roster = writes.find(w => w.collection === 'playerRosters');
    expect(roster.data.invited).toBe(false);
  });

  test('player profile stores coachUid and coachName', () => {
    const user = { uid: 'p-uid', email: 'player@test.com' };
    const writes = buildJoinBatch(user, 'coach-123', 'Coach Alex');
    const userWrite = writes.find(w => w.collection === 'users');
    expect(userWrite.data.coachUid).toBe('coach-123');
    expect(userWrite.data.coachName).toBe('Coach Alex');
  });

  test('linkRequest marked playerInitiated', () => {
    const user = { uid: 'p-uid', email: 'player@test.com' };
    const writes = buildJoinBatch(user, 'c-uid', 'Coach');
    const lr = writes.find(w => w.collection === 'linkRequests');
    expect(lr.data.playerInitiated).toBe(true);
    expect(lr.data.status).toBe('accepted');
  });

  test('does NOT write to playerCoach (no isCoach permission)', () => {
    const user = { uid: 'p-uid', email: 'player@test.com' };
    const writes = buildJoinBatch(user, 'c-uid', 'Coach');
    const pcWrites = writes.filter(w => w.collection === 'playerCoach');
    expect(pcWrites).toHaveLength(0);
  });

  test('roster path uses sanitized email', () => {
    const user = { uid: 'p-uid', email: 'player.name@test.com' };
    const writes = buildJoinBatch(user, 'c-uid', 'Coach');
    const roster = writes.find(w => w.collection === 'playerRosters');
    expect(roster.path).toContain('player_name@test_com');
  });
});

describe('joinCoach validation', () => {
  function validateJoinCode(input) {
    const code = (input || '').trim().toUpperCase();
    if (code.length < 4) return { valid: false, reason: 'Code too short' };
    if (code.length > 8) return { valid: false, reason: 'Code too long' };
    return { valid: true, code };
  }

  test('valid 6-char code passes', () => {
    expect(validateJoinCode('AB3X9Z').valid).toBe(true);
  });

  test('empty input fails', () => {
    expect(validateJoinCode('').valid).toBe(false);
  });

  test('3-char code too short', () => {
    expect(validateJoinCode('ABC').valid).toBe(false);
  });

  test('normalises to uppercase', () => {
    const result = validateJoinCode('ab3x9z');
    expect(result.code).toBe('AB3X9Z');
  });

  test('strips whitespace before checking', () => {
    expect(validateJoinCode('  AB3X9Z  ').valid).toBe(true);
  });
});

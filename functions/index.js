/**
 * bACE CAMP — Firebase Cloud Functions
 * Email notifications via SendGrid
 *
 * Triggers:
 *  1. onCoachInvite       — linkRequests/{id} created  → email player
 *  2. onEvaluationSaved   — evaluations/{uid}/sessions/{id} created → email coach
 *  3. onTrainingAssigned  — coachTraining/{uid}/sessions/{id} created → email player
 *  4. onFeedbackSent      — coachFeedback/{uid}/messages/{id} created → email player
 */

const functions = require('firebase-functions');
const admin     = require('firebase-admin');
const sgMail    = require('@sendgrid/mail');

admin.initializeApp();

const API_KEY   = process.env.SENDGRID_API_KEY;
const FROM      = process.env.SENDGRID_FROM_EMAIL || 'noreply@bacecamp.app';
const APP_NAME  = 'bACE CAMP';

function initSendGrid() {
  if (!API_KEY) throw new Error('SENDGRID_API_KEY not set');
  sgMail.setApiKey(API_KEY);
}

// ── Helpers ────────────────────────────────────────────────────────────────────

async function getUserData(uid) {
  if (!uid) return {};
  const snap = await admin.firestore().collection('users').doc(uid).get();
  return snap.exists ? snap.data() : {};
}

function baseTemplate(title, bodyHtml) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>
    body { margin:0; padding:0; background:#f4f6fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width:560px; margin:32px auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.08); }
    .header { background:#006400; padding:32px 28px 24px; text-align:center; }
    .header h1 { margin:0; color:#fff; font-size:26px; letter-spacing:1px; }
    .header p  { margin:6px 0 0; color:#A5D6A7; font-size:13px; }
    .body   { padding:28px 28px 20px; color:#333; line-height:1.6; font-size:15px; }
    .body h2 { color:#006400; font-size:18px; margin-top:0; }
    .cta    { display:inline-block; margin:20px 0 8px; padding:14px 32px; background:#006400; color:#fff !important; border-radius:10px; text-decoration:none; font-weight:700; font-size:15px; }
    .footer { background:#f4f6fa; padding:16px 28px; text-align:center; font-size:12px; color:#aaa; }
    .badge  { display:inline-block; background:#E8F5E9; color:#2E7D32; border-radius:8px; padding:4px 12px; font-size:12px; font-weight:600; margin-bottom:12px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>${APP_NAME}</h1>
      <p>Tennis Coaching Platform</p>
    </div>
    <div class="body">
      <h2>${title}</h2>
      ${bodyHtml}
    </div>
    <div class="footer">&copy; ${new Date().getFullYear()} bACE CAMP. All rights reserved.</div>
  </div>
</body>
</html>`;
}

// ── 1. Coach invites a player ─────────────────────────────────────────────────

exports.onCoachInvite = functions.firestore
  .document('linkRequests/{requestId}')
  .onCreate(async (snap) => {
    try {
      initSendGrid();
      const { playerEmail, coachUid } = snap.data();
      if (!playerEmail || !coachUid) return null;

      const coach = await getUserData(coachUid);
      const coachName = coach.displayName || 'Your Coach';

      const html = baseTemplate(
        `You've been invited to train with ${coachName}!`,
        `<span class="badge">New Invitation</span>
         <p>Hi there,</p>
         <p><strong>${coachName}</strong> has invited you to join their team on <strong>${APP_NAME}</strong> — a professional tennis coaching platform to track your performance, receive personalised training plans, and communicate directly with your coach.</p>
         <p><strong>To get started:</strong></p>
         <p style="font-weight:700;margin:12px 0 4px;">Step 1 — Install Expo Go</p>
         <p style="margin:0 0 8px;font-size:14px;color:#555;">bACE CAMP runs through the free Expo Go app during testing (no App Store approval needed).</p>
         <table style="width:100%;margin:20px 0;">
           <tr>
             <td style="padding-right:8px;">
               <a href="https://apps.apple.com/app/expo-go/id982107779"
                  style="display:block;background:#000;color:#fff;text-align:center;padding:13px 10px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">
                 📱 Download on the<br/>App Store
               </a>
             </td>
             <td style="padding-left:8px;">
               <a href="https://play.google.com/store/apps/details?id=host.exp.exponent"
                  style="display:block;background:#006400;color:#fff;text-align:center;padding:13px 10px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">
                 🤖 Get it on<br/>Google Play
               </a>
             </td>
           </tr>
         </table>
         <p style="font-weight:700;margin:16px 0 4px;">Step 2 — Open the app</p>
         <p style="margin:0 0 12px;font-size:14px;color:#555;">Tap the button below. It will open a page in your browser with a button that launches bACE CAMP inside Expo Go.</p>
         <p style="text-align:center;margin:12px 0 6px;">
           <a href="https://bace-camp-project.web.app"
              style="display:inline-block;background:#1B5E20;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
             🎾 Open bACE CAMP
           </a>
         </p>
         <p style="text-align:center;margin:4px 0 12px;">
           <a href="https://expo.dev/accounts/alexis84/projects/bace-camp-project"
              style="font-size:13px;color:#006400;">
             Or view project page on Expo →
           </a>
         </p>
         <div style="background:#f4f6fa;border-radius:8px;padding:12px 16px;margin:8px 0;font-size:13px;color:#555;">
           <strong>Manual URL (paste into Expo Go → Enter URL):</strong><br/>
           <span style="font-family:monospace;word-break:break-all;">exp://u.expo.dev/d8d783ce-6cc0-4774-88db-00e82778910a?channel-name=preview</span>
         </div>
         <p style="font-weight:700;margin:16px 0 4px;">Step 3 — Create your account</p>
         <ol style="margin:0;padding-left:20px;font-size:14px;color:#555;">
           <li>Sign up using this exact email: <strong>${playerEmail}</strong></li>
           <li>Select <strong>Player</strong> as your role</li>
           <li>You'll be automatically connected to ${coachName}'s roster</li>
         </ol>
         <p style="background:#fffbe6;border:1px solid #ffe58f;border-radius:8px;padding:12px 16px;font-size:13px;color:#7d6608;margin-top:12px;">
           <strong>Note:</strong> Once ${APP_NAME} is live in the App Store and Google Play, you'll be able to download it directly. Your account and connection to ${coachName} will carry over automatically.
         </p>
         <p style="color:#888;font-size:13px;">If you weren't expecting this invitation, you can safely ignore this email.</p>`
      );

      await sgMail.send({
        to: playerEmail,
        from: { email: FROM, name: APP_NAME },
        subject: `${coachName} has invited you to ${APP_NAME}`,
        html,
      });

      return null;
    } catch (e) {
      console.error('onCoachInvite error:', e);
      return null;
    }
  });

// ── 2. Player submits evaluation → notify coach ───────────────────────────────

exports.onEvaluationSaved = functions.firestore
  .document('evaluations/{playerUid}/sessions/{sessionId}')
  .onCreate(async (snap, context) => {
    try {
      initSendGrid();
      const { playerUid } = context.params;
      const sessionData = snap.data();

      const player = await getUserData(playerUid);
      const coachUid = player.coachUid;
      if (!coachUid) return null;

      const coach = await getUserData(coachUid);
      if (!coach.email) return null;

      const playerName = player.displayName || player.email || 'Your player';
      const perfScore  = sessionData.performanceScore || sessionData.overallScore || '—';
      const wellScore  = sessionData.wellnessScore || '—';
      const date       = new Date().toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });

      const html = baseTemplate(
        `${playerName} submitted a new evaluation`,
        `<span class="badge">New Evaluation</span>
         <p>Hi ${coach.displayName || 'Coach'},</p>
         <p><strong>${playerName}</strong> has just submitted a new self-evaluation on ${date}.</p>
         <table style="width:100%;border-collapse:collapse;margin:16px 0;">
           <tr style="background:#f4f6fa;">
             <td style="padding:10px 14px;border-radius:8px 0 0 8px;font-weight:600;color:#555;">Performance Score</td>
             <td style="padding:10px 14px;font-weight:700;color:#006400;font-size:18px;">${perfScore}</td>
           </tr>
           <tr>
             <td style="padding:10px 14px;font-weight:600;color:#555;">Wellness Score</td>
             <td style="padding:10px 14px;font-weight:700;color:#0D47A1;font-size:18px;">${wellScore}</td>
           </tr>
         </table>
         <p>Open the app to view the full evaluation and provide feedback.</p>`
      );

      await sgMail.send({
        to: coach.email,
        from: { email: FROM, name: APP_NAME },
        subject: `${playerName} submitted a new evaluation`,
        html,
      });

      return null;
    } catch (e) {
      console.error('onEvaluationSaved error:', e);
      return null;
    }
  });

// ── 3. Coach assigns training → notify player ─────────────────────────────────

exports.onTrainingAssigned = functions.firestore
  .document('coachTraining/{playerUid}/sessions/{sessionId}')
  .onCreate(async (snap, context) => {
    try {
      initSendGrid();
      const { playerUid } = context.params;
      const training = snap.data();

      const player = await getUserData(playerUid);
      if (!player.email) return null;

      const coachUid  = player.coachUid;
      const coach     = coachUid ? await getUserData(coachUid) : {};
      const coachName = coach.displayName || 'Your Coach';
      const title     = training.title || 'New Training Session';
      const notes     = training.notes || training.description || '';

      const html = baseTemplate(
        `New training session assigned by ${coachName}`,
        `<span class="badge">New Training</span>
         <p>Hi ${player.displayName || 'Athlete'},</p>
         <p><strong>${coachName}</strong> has assigned you a new training session:</p>
         <div style="background:#f4f6fa;border-radius:10px;padding:16px 20px;margin:16px 0;">
           <p style="margin:0;font-size:17px;font-weight:700;color:#1B5E20;">${title}</p>
           ${notes ? `<p style="margin:8px 0 0;color:#555;font-size:14px;">${notes}</p>` : ''}
         </div>
         <p>Open the app to view the full training plan and log your session.</p>`
      );

      await sgMail.send({
        to: player.email,
        from: { email: FROM, name: APP_NAME },
        subject: `New training assigned by ${coachName}`,
        html,
      });

      return null;
    } catch (e) {
      console.error('onTrainingAssigned error:', e);
      return null;
    }
  });

// ── 4. Coach sends feedback → notify player ───────────────────────────────────

exports.onFeedbackSent = functions.firestore
  .document('coachFeedback/{playerUid}/messages/{msgId}')
  .onCreate(async (snap, context) => {
    try {
      initSendGrid();
      const { playerUid } = context.params;
      const feedback = snap.data();

      const player = await getUserData(playerUid);
      if (!player.email) return null;

      const coachUid  = player.coachUid;
      const coach     = coachUid ? await getUserData(coachUid) : {};
      const coachName = coach.displayName || 'Your Coach';
      const message   = feedback.message || feedback.text || '';

      const html = baseTemplate(
        `Feedback from ${coachName}`,
        `<span class="badge">Coach Feedback</span>
         <p>Hi ${player.displayName || 'Athlete'},</p>
         <p><strong>${coachName}</strong> has sent you new feedback:</p>
         <div style="background:#f4f6fa;border-left:4px solid #006400;border-radius:0 10px 10px 0;padding:16px 20px;margin:16px 0;">
           <p style="margin:0;color:#333;font-size:15px;line-height:1.6;">${message}</p>
         </div>
         <p>Open the app to view your full feedback history and reply to your coach.</p>`
      );

      await sgMail.send({
        to: player.email,
        from: { email: FROM, name: APP_NAME },
        subject: `New feedback from ${coachName}`,
        html,
      });

      return null;
    } catch (e) {
      console.error('onFeedbackSent error:', e);
      return null;
    }
  });

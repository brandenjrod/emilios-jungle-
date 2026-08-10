// Emilio Joe was born July 29, 2026 at 9:11 AM.
export const BIRTH_DATE = new Date("2026-07-29T09:11:00");

export function ageInDays(now = new Date()) {
  const diffMs = now.getTime() - BIRTH_DATE.getTime();
  return Math.max(0, Math.floor(diffMs / 86400000));
}

// Calendar-accurate "X months, Y days" breakdown (not just days/30).
export function ageBreakdown(now = new Date()) {
  let months = (now.getFullYear() - BIRTH_DATE.getFullYear()) * 12 + (now.getMonth() - BIRTH_DATE.getMonth());
  let cursor = new Date(BIRTH_DATE);
  cursor.setMonth(cursor.getMonth() + months);
  if (cursor > now) {
    months -= 1;
    cursor = new Date(BIRTH_DATE);
    cursor.setMonth(cursor.getMonth() + months);
  }
  const days = Math.floor((now.getTime() - cursor.getTime()) / 86400000);
  return { months, days, totalDays: ageInDays(now) };
}

export function formatAge(now = new Date()) {
  const { months, days, totalDays } = ageBreakdown(now);
  if (totalDays < 30) {
    return `${totalDays} day${totalDays === 1 ? "" : "s"} old`;
  }
  if (months < 1) return `${days} day${days === 1 ? "" : "s"} old`;
  if (days === 0) return `${months} month${months === 1 ? "" : "s"} old`;
  return `${months} month${months === 1 ? "" : "s"}, ${days} day${days === 1 ? "" : "s"} old`;
}

// Editable milestone timeline. `days` is age-in-days when it unlocks.
// Consolidated to the standard pediatric checkpoints (newborn, 2/4/6/9/12
// months) that Cleveland Clinic, Michigan's MI Kids Matter, WebMD, and
// Texas WIC all build their milestone lists around, plus the 3-week
// tummy-time callout. Kept short on purpose — a handful of real, fun
// checkpoints rather than a cluttered week-by-week list.
export const MILESTONES = [
  { days: 0, label: "Newborn", emoji: "🐣", title: "Welcome to the jungle, Emilio!", text: "The whole world is brand new — mostly eating, sleeping, and learning your voice and face up close." },
  { days: 21, label: "3 weeks", emoji: "🐒", title: "Emilio's 3 weeks old!!", text: "He's ready for tummy time! Short, supervised sessions build the neck and shoulder strength he'll need to lift his head." },
  { days: 30, label: "1 month", emoji: "🌴", title: "Emilio's 1 month old!", text: "A strong grip, a stare that finds your face, and the first hints of head control during tummy time." },
  { days: 60, label: "2 months", emoji: "😊", title: "Emilio's 2 months old!", text: "The first real social smile tends to show up around now, along with cooing sounds and steadier head control." },
  { days: 120, label: "4 months", emoji: "😂", title: "Emilio's 4 months old!", text: "Laughing out loud, pushing up on his arms, and bringing his hands to his mouth on purpose — babbling isn't far behind." },
  { days: 180, label: "6 months", emoji: "🥄", title: "Emilio's 6 months old!", text: "Rolling tummy-to-back, sitting with support, and likely ready to try his first pureed foods." },
  { days: 270, label: "9 months", emoji: "🐾", title: "Emilio's 9 months old!", text: "Sitting without help, on the move (crawling or scooting), and starting to understand 'no' and play peekaboo." },
  { days: 365, label: "1 year", emoji: "🎉", title: "Emilio's 1st birthday!!", text: "Cruising along furniture, maybe a first step or two, waving bye-bye, and calling out 'mama' or 'dada' on purpose." },
];

export function currentMilestone(days) {
  let current = MILESTONES[0];
  for (const m of MILESTONES) {
    if (m.days <= days) current = m;
    else break;
  }
  return current;
}

export function nextMilestone(days) {
  return MILESTONES.find((m) => m.days > days) || null;
}

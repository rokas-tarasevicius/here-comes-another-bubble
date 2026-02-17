export const FIRST_NAMES = [
  'Sarah', 'Marcus', 'Priya', 'James', 'Li', 'Sofia', 'Alex', 'Kenji',
  'Fatima', 'Carlos', 'Emma', 'Devon', 'Mei', 'Jordan', 'Nadia',
  'Tyler', 'Amara', 'Raj', 'Olivia', 'Hassan', 'Yuki', 'Zoe',
  'Ibrahim', 'Luna', 'Mateo', 'Anya', 'Darius', 'Isla', 'Omar',
  'Mia', 'Kai', 'Nina', 'Sam', 'Leila', 'Max', 'Ava', 'Chen',
  'Ruby', 'Aiden', 'Sana', 'Leo', 'Tara', 'Finn', 'Eva', 'Rio',
  'Iris', 'Cole', 'Zara', 'Noah', 'Jade',
];

export const LAST_NAMES = [
  'Chen', 'Johnson', 'Patel', 'Kim', 'Rodriguez', 'Nakamura', 'O\'Brien',
  'Singh', 'Müller', 'Santos', 'Lee', 'Anderson', 'Sharma', 'Park',
  'Williams', 'Zhang', 'Martinez', 'Tanaka', 'Brown', 'Ali',
  'Davis', 'Wang', 'Garcia', 'Sato', 'Wilson', 'Huang', 'Moore',
  'Kumar', 'Taylor', 'Yamamoto', 'Thomas', 'Gupta', 'Jackson',
  'Suzuki', 'White', 'Khan', 'Harris', 'Ito', 'Martin', 'Cho',
  'Thompson', 'Das', 'Robinson', 'Watanabe', 'Clark', 'Malik',
  'Lewis', 'Takahashi', 'Hall', 'Reddy',
];

export const TRAIT_POOL = [
  'fast-learner', '10x-engineer', 'mentor', 'night-owl', 'team-player',
  'perfectionist', 'creative-thinker', 'data-driven', 'domain-expert', 'startup-veteran',
];

export function randomName(): string {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${first} ${last}`;
}

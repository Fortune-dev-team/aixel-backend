// Semua nilai di sini ASUMSI, bukan nilai resmi. Ganti di sini saja setelah diputuskan lead/Dev 1.
export const GOAL_STATUS_ACTIVE = 'ACTIVE';
export const GOAL_STATUS_ABANDONED = 'ABANDONED';

// Status progres level yang baru dibuka (Level 1 saat goal dibuat)
export const LEVEL_PROGRESS_UNLOCKED = 'UNLOCKED';

// Goal selalu mulai dari Level 1
export const START_LEVEL_NUMBER = 1;

// Batas goal aktif: dibaca dari system_rules (key di bawah), fallback ke default
export const MAX_ACTIVE_GOALS_RULE_KEY = 'max_active_goals';
export const MAX_ACTIVE_GOALS_DEFAULT = 2;

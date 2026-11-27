// Semua nilai di sini ASUMSI, bukan nilai resmi. Ganti di sini saja setelah diputuskan lead/Dev 1.
export const PRETEST_STATUS_IN_PROGRESS = 'IN_PROGRESS';
export const PRETEST_STATUS_SUBMITTED = 'SUBMITTED';

export const PRETEST_PURPOSE_SELF = 'PRETEST_SELF';
export const PRETEST_PURPOSE_SJT = 'PRETEST_SJT';

export const QUESTION_STATUS_APPROVED = 'APPROVED';

// ASUMSI: skala jawaban 1-5 (self-assessment dan rating opsi SJT)
export const LIKERT_MIN = 1;
export const LIKERT_MAX = 5;
export const MAX_ANSWERS_PER_REQUEST = 100;

// ASUMSI: ambang contoh, BUKAN nilai resmi. Tetapkan setelah uji coba, nanti pindah ke system_rules.
export const SJT_THRESHOLD = 0.6;
export const SELF_LOW_THRESHOLD = 3;
export const SJT_LABEL_FIT = 'Sesuai';
export const SJT_LABEL_LOW = 'Kurang sesuai';

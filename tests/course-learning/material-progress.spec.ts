
import { test, expect } from '@playwright/test';

const menteeId = '6aacc557-549f-4664-8730-b5fc44a28bec';
const mentorToken = process.env.MENTOR_TOKEN;

test.describe('A.5 - Mentor Mentee Material Progress', () => {
  test('harus menolak request tanpa token', async ({ request }) => {
    const response = await request.get(
      `mentor/mentees/${menteeId}`,
    );

    expect(response.status()).toBe(401);
  });

  test('mentor dapat melihat progress materi mentee', async ({ request }) => {
    test.skip(!mentorToken, 'MENTOR_TOKEN belum diatur');

    const response = await request.get(
      `mentor/mentees/${menteeId}`,
      {
        headers: {
          Authorization: `Bearer ${mentorToken}`,
        },
      },
    );

    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body.data.candidate.id).toBe(menteeId);

    expect(body.data).toHaveProperty('materialProgress');
    expect(body.data.materialProgress).toHaveProperty('totalMaterials');
    expect(body.data.materialProgress).toHaveProperty('completedMaterials');
    expect(body.data.materialProgress).toHaveProperty('completionPercentage');

    expect(
      Array.isArray(body.data.materialProgress.materials),
    ).toBe(true);
  });
});

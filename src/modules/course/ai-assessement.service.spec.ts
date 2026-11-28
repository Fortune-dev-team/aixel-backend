import { BadRequestException } from '@nestjs/common';
import { AiAssessmentService } from './ai-assessement.service';

describe('AiAssessmentService grading validation', () => {
    const service = Object.create(
        AiAssessmentService.prototype,
    ) as AiAssessmentService & {
        parseAndValidateGrade: (
        raw: string,
        criteria: Array<{ id: string }>,
        descriptors: Array<{
            id: string;
            criterion_id: string;
            score: number;
        }>,
        scaleMax: number,
        ) => unknown;
    };

    it('rejects non-JSON model output', () => {
        expect(() =>
        service['parseAndValidateGrade'](
            'not json',
            [{ id: 'criterion-1' }],
            [],
            4,
        ),
        ).toThrow(BadRequestException);
    });

    it('rejects missing rubric criterion scores', () => {
        expect(() =>
        service['parseAndValidateGrade'](
            JSON.stringify({
            totalScore: 0,
            confidence: 0.9,
            reasoning: 'Reason',
            criteria: [],
            }),
            [{ id: 'criterion-1' }],
            [],
            4,
        ),
        ).toThrow(BadRequestException);
    });

    it('rejects scores outside the rubric scale', () => {
        expect(() =>
        service['parseAndValidateGrade'](
            JSON.stringify({
            totalScore: 5,
            confidence: 0.9,
            reasoning: 'Reason',
            criteria: [
                {
                criterionId: 'criterion-1',
                score: 5,
                evidence: 'Evidence',
                matchedDescriptorId: null,
                },
            ],
            }),
            [{ id: 'criterion-1' }],
            [],
            4,
        ),
        ).toThrow(BadRequestException);
    });
});
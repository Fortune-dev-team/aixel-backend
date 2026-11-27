import { Test, TestingModule } from '@nestjs/testing';

import { DashboardsService, PRISMA_CLIENT } from './dashboards.service';

describe('DashboardsService', () => {
  let service: DashboardsService;

  const prismaMock = {
    users: {
      count: jest.fn(),
      groupBy: jest.fn(),
    },

    attributes: {
      count: jest.fn(),
    },

    memberAttributes: {
      count: jest.fn(),
    },

    auditLogs: {
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardsService,
        {
          provide: PRISMA_CLIENT,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<DashboardsService>(DashboardsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOverview', () => {
    it('should return dashboard overview', async () => {
      prismaMock.users.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(90)
        .mockResolvedValueOnce(10);

      prismaMock.attributes.count
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(18);

      prismaMock.memberAttributes.count
        .mockResolvedValueOnce(70)
        .mockResolvedValueOnce(5);

      prismaMock.auditLogs.count.mockResolvedValueOnce(250);

      const result = await service.getOverview();

      expect(result).toEqual({
        total_members: 100,
        total_team_members: 90,
        total_admins: 10,
        total_competencies: 20,
        active_competencies: 18,
        valid_member_competencies: 70,
        expired_member_competencies: 5,
        total_audit_activities: 250,
      });
    });
  });

  describe('getMemberStatistics', () => {
    it('should return member statistics', async () => {
      prismaMock.users.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(90)
        .mockResolvedValueOnce(10);

      prismaMock.users.groupBy.mockResolvedValue([
        {
          system_role: 'tim',
          _count: {
            _all: 90,
          },
        },
        {
          system_role: 'admin',
          _count: {
            _all: 10,
          },
        },
      ]);

      const result = await service.getMemberStatistics();

      expect(result).toEqual({
        total_members: 100,
        active_members: 90,
        deleted_members: 10,
        by_role: [
          {
            role: 'tim',
            count: 90,
          },
          {
            role: 'admin',
            count: 10,
          },
        ],
      });
    });
  });

  describe('getCompetencyStatistics', () => {
    it('should return competency statistics', async () => {
      prismaMock.attributes.count
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(18)
        .mockResolvedValueOnce(2);

      prismaMock.memberAttributes.count
        .mockResolvedValueOnce(70)
        .mockResolvedValueOnce(5);

      const result = await service.getCompetencyStatistics();

      expect(result).toEqual({
        total_competencies: 20,
        active_competencies: 18,
        archived_competencies: 2,
        valid_member_competencies: 70,
        expired_member_competencies: 5,
      });
    });
  });

  describe('getActivitySummary', () => {
    it('should return grouped audit activity', async () => {
      prismaMock.auditLogs.count.mockResolvedValue(30);

      prismaMock.auditLogs.groupBy.mockResolvedValue([
        {
          action: 'UPDATE',
          _count: {
            _all: 20,
          },
        },
        {
          action: 'CREATE',
          _count: {
            _all: 10,
          },
        },
      ]);

      const result = await service.getActivitySummary({
        page: 1,
        limit: 20,
      });

      expect(result).toEqual({
        total: 30,
        page: 1,
        limit: 20,
        total_pages: 2,
        activities: [
          {
            action: 'UPDATE',
            count: 20,
          },
          {
            action: 'CREATE',
            count: 10,
          },
        ],
      });
    });
  });

  it('should reject invalid activity date range', async () => {
    await expect(
      service.getActivitySummary({
        page: 1,
        limit: 20,
        start_date: '2026-12-01T00:00:00.000Z',
        end_date: '2026-11-01T00:00:00.000Z',
      }),
    ).rejects.toThrow('start_date tidak boleh lebih besar dari end_date');
  });
});

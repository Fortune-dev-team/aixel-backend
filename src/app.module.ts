import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './modules/health/health.module';
import { AuditModule } from './modules/audit/audit.module';
import { InterventionsModule } from './modules/interventions/interventions.module';
import { AiMonitoringModule } from './modules/ai-monitoring/ai-monitoring.module';
import { DashboardsModule } from './modules/dashboards/dashboards.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { MemberAttributesModule } from './modules/member-attributes/member-attributes.module';
import { InterviewsModule } from './modules/interviews/interviews.module';
import { MentorModule } from './modules/mentor/mentor.module';
import { MentoringModule } from './modules/mentoring/mentoring.module';
import { CourseModule } from './modules/course/course.module';
import { GoalsModule } from './modules/goals/goals.module';
import { PretestModule } from './modules/pretest/pretest.module';
import { RulesModule } from './modules/rules/rules.module';
import { RubricsModule } from './modules/rubrics/rubrics.module';
import { QuestionBankModule } from './modules/question-bank/question-bank.module';
import { CourseMaterialsModule } from './modules/course-materials/course-materials.module';
import { AttributesModule } from './modules/attributes/attributes.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminKnowledgeManagementModule } from './modules/admin-knowledge-management/admin-knowledge-management.module';
import { RenewalsModule } from './modules/renewals/renewals.module';
import { BullModule } from '@nestjs/bullmq';
import { AiAssessmentModule } from './modules/course/ai-assessement.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        url: configService.getOrThrow<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    BullModule.forRootAsync({
    inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = new URL(config.getOrThrow<string>('REDIS_URL'));

        return {
          connection: {
            host: redisUrl.hostname,
            port: Number(redisUrl.port || 6379),
            username: redisUrl.username || undefined,
            password: redisUrl.password || undefined,
            db: redisUrl.pathname.length > 1
              ? Number(redisUrl.pathname.slice(1))
              : 0,
            tls: redisUrl.protocol === 'rediss:' ? {} : undefined,
          },
        };
      },
    }),
    AuthModule,
    UsersModule,
    AttributesModule,
    AdminKnowledgeManagementModule,
    CourseMaterialsModule,
    QuestionBankModule,
    RubricsModule,
    RulesModule,
    PretestModule,
    GoalsModule,
    CourseModule,
    MentoringModule,
    MentorModule,
    InterviewsModule,
    MemberAttributesModule,
    CertificatesModule,
    RenewalsModule,
    NotificationsModule,
    DashboardsModule,
    AiMonitoringModule,
    InterventionsModule,
    AuditModule,
    HealthModule,
    AiAssessmentModule,
  ],
  controllers: [AppController],
  providers: [AppService, Logger],
})
export class AppModule {}

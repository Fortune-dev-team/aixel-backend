import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
    const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
    const adminPasswordHash = await bcrypt.hash(adminPassword, 12);

    const admin = await prisma.users.upsert({
        where: { email: adminEmail },
        update: { full_name: 'System Administrator', system_role: 'ADMIN', status: 'ACTIVE' },
        create: {
        email: adminEmail,
        password_hash: adminPasswordHash,
        full_name: 'System Administrator',
        system_role: 'ADMIN',
        status: 'ACTIVE',
        },
    });

    await prisma.userProfiles.upsert({
        where: { user_id: admin.id },
        update: { job_title: 'Administrator', timezone: 'Asia/Jakarta' },
        create: { user_id: admin.id, job_title: 'Administrator', timezone: 'Asia/Jakarta' },
    });

    const category = await prisma.attributeCategories.upsert({
        where: { slug: 'general' },
        update: { name: 'General', description: 'General competency category', sort_order: 0 },
        create: { name: 'General', slug: 'general', description: 'General competency category', sort_order: 0 },
    });

    const attribute = await prisma.attributes.upsert({
        where: { code: 'COMMUNICATION' },
        update: { name: 'Communication', category_id: category.id, is_active: true },
        create: {
        category_id: category.id,
        code: 'COMMUNICATION',
        name: 'Communication',
        description: 'Seed sample competency; replace with your actual competency catalog.',
        is_active: true,
        validity_months: 12,
        created_by: admin.id,
        },
    });

    const level1 = await prisma.attributeLevels.findFirst({
        where: { attribute_id: attribute.id, level_number: 1 },
    });
    const level = level1 ?? await prisma.attributeLevels.create({
        data: {
        attribute_id: attribute.id,
        level_number: 1,
        level_type: 'FOUNDATION',
        title: 'Foundation',
        description: 'Sample introductory level',
        miller_stage: 'KNOWS',
        pass_score: 70,
        max_retry: 3,
        question_count: 5,
        },
    });

    const indicatorText = [
        'Can explain the core concept of the competency.',
        'Can identify an appropriate example in a work context.',
    ];
    for (let i = 0; i < indicatorText.length; i++) {
        const exists = await prisma.levelIndicators.findFirst({
        where: { level_id: level.id, description: indicatorText[i] },
        });
        if (!exists) {
        await prisma.levelIndicators.create({
            data: { level_id: level.id, description: indicatorText[i], sort_order: i + 1 },
        });
        }
    }

    const rules = [
        { key: 'app.name', value: 'Aixel', value_type: 'string', description: 'Application name' },
        { key: 'learning.default_pass_score', value: 70, value_type: 'number', description: 'Default learning pass score' },
        { key: 'learning.max_attempts', value: 3, value_type: 'number', description: 'Default maximum attempts' },
        { key: 'ai.grading_confidence_threshold', value: 0.75, value_type: 'number', description: 'Confidence threshold for AI grading' },
    ];
    for (const rule of rules) {
        await prisma.systemRules.upsert({
        where: { key: rule.key },
        update: { value: rule.value, value_type: rule.value_type, description: rule.description, updated_by: admin.id },
        create: { ...rule, updated_by: admin.id },
        });
    }

    console.log('Seed complete. Admin:', adminEmail);
    console.log('Sample attribute:', attribute.code, '| level:', level.level_number);
    console.log('Change SEED_ADMIN_PASSWORD before running this seed in any shared environment.');
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => prisma.$disconnect());

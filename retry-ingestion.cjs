require('dotenv').config()
const { Queue } = require('bullmq');

async function main() {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error('REDIS_URL belum tersedia');
  }

  const connection = new URL(redisUrl);

  const queue = new Queue('knowledge-ingestion', {
    connection: {
      host: connection.hostname,
      port: Number(connection.port || 6379),
      username: connection.username || undefined,
      password: connection.password || undefined,
      db: connection.pathname
        ? Number(connection.pathname.slice(1))
        : 0,
      ...(connection.protocol === 'rediss:' ? { tls: {} } : {}),
    },
  });

  const jobId =
    'ingest-5c2d7a1e-2802-4bfa-b95f-7bfb2020cf7f';

  const job = await queue.getJob(jobId);

  if (!job) {
    throw new Error(`Job ${jobId} tidak ditemukan`);
  }

  console.log('Job ditemukan:', job.id);
  console.log('Status:', await job.getState());
  console.log('Percobaan sebelumnya:', job.attemptsMade);

  await job.retry('failed');

  console.log('Job berhasil dimasukkan kembali ke antrean.');

  await queue.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

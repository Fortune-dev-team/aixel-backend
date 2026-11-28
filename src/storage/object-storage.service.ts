import {
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ObjectStorageService {
    private readonly client: S3Client;
    private readonly bucket: string;

    constructor(config: ConfigService) {
        this.bucket = config.getOrThrow<string>('S3_BUCKET');

        this.client = new S3Client({
        endpoint: config.get<string>('S3_ENDPOINT'),
        region: config.get<string>('S3_REGION', 'us-east-1'),
        forcePathStyle: true,
        credentials: {
            accessKeyId: config.getOrThrow<string>('S3_ACCESS_KEY'),
            secretAccessKey: config.getOrThrow<string>('S3_SECRET_KEY'),
        },
        });
    }

    async put(key: string, body: Buffer, contentType: string): Promise<void> {
        await this.client.send(
        new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: body,
            ContentType: contentType,
        }),
        );
    }

    async get(key: string): Promise<Buffer> {
        const response = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
        );

        if (!response.Body) throw new Error('Object storage returned an empty body');

        return Buffer.from(await response.Body.transformToByteArray());
    }
}
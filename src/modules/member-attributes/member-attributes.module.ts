import { Module } from '@nestjs/common';
import { MemberAttributesController } from './member-attributes.controller';
import { MemberAttributesService } from './member-attributes.service';

@Module({
  controllers: [MemberAttributesController],
  providers: [MemberAttributesService]
})
export class MemberAttributesModule {}

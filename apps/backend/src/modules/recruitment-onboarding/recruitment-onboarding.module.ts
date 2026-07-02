import { Module } from '@nestjs/common';
import { RecruitmentOnboardingController } from './recruitment-onboarding.controller';
import { RecruitmentOnboardingService } from './recruitment-onboarding.service';

@Module({
  controllers: [RecruitmentOnboardingController],
  providers: [RecruitmentOnboardingService],
})
export class RecruitmentOnboardingModule {}

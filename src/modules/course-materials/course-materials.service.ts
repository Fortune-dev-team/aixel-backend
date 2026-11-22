import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface'

@Injectable()
export class CourseMaterialsService {
    findAll(
        goalId: string,
        levelId: string,
        user: AuthenticatedUser
    ) {
        return {
            message: "Daftar materi pembelajaran",
            goalId,
            levelId,
            requestedBy: user.id
        }
    }

}

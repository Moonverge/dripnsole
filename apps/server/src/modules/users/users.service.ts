import bcrypt from 'bcrypt'
import type { UsersRepository } from './users.repository.js'
import type { UpdateProfileBody, ChangePasswordBody } from './users.model.js'

export function createUsersService(repo: UsersRepository) {
  return {
    async updateProfile(userId: string, body: UpdateProfileBody) {
      const patch: { name?: string; profilePic?: string } = {}
      if (body.name !== undefined) patch.name = body.name
      if (body.profilePic !== undefined) patch.profilePic = body.profilePic
      if (Object.keys(patch).length === 0) {
        return { kind: 'no_changes' as const }
      }
      const rows = await repo.updateProfile(userId, patch)
      if (!rows[0]) return { kind: 'not_found' as const }
      return { kind: 'ok' as const, user: rows[0] }
    },

    async changePassword(userId: string, body: ChangePasswordBody) {
      const rows = await repo.findById(userId)
      const user = rows[0]
      if (!user) return { kind: 'not_found' as const }

      const valid = await bcrypt.compare(body.currentPassword, user.passwordHash)
      if (!valid) return { kind: 'wrong_password' as const }

      const newHash = await bcrypt.hash(body.newPassword, 12)
      await repo.updatePasswordHash(userId, newHash)
      return { kind: 'ok' as const }
    },
  }
}

export type UsersService = ReturnType<typeof createUsersService>

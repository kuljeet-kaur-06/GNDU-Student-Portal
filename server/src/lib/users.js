export function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    universityId: user.universityId,
    email: user.email,
    name: user.name,
    role: user.role.toLowerCase(),
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
    department: user.department?.name || null,
  }
}

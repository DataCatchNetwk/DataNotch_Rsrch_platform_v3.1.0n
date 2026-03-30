export class AdminGovernanceMapper {
  static user(item: any) {
    return {
      id: item.id,
      fullName: `${item.firstName} ${item.lastName}`,
      email: item.email,
      role: item.role,
      status: item.status,
      institution: item.institution ?? null,
      lastLogin: item.lastLoginAt ? new Date(item.lastLoginAt).toISOString() : null,
    };
  }

  static accessRequest(item: any) {
    return {
      id: item.id,
      fullName: `${item.requester.firstName} ${item.requester.lastName}`,
      email: item.requester.email,
      requestedRole: item.requestedRole,
      status: item.status,
      submittedAt: new Date(item.createdAt).toISOString(),
    };
  }

  static audit(item: any) {
    return {
      id: item.id,
      action: item.action,
      targetType: item.targetType,
      targetId: item.targetId,
      actor: item.actor ? `${item.actor.firstName} ${item.actor.lastName}` : "System",
      severity: item.severity,
      createdAt: new Date(item.createdAt).toISOString(),
    };
  }
}

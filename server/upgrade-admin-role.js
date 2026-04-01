import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

(async () => {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: 'donneyong.1@osu.edu' },
      include: { roles: true }
    });
    
    if (!user) {
      console.error('User not found');
      process.exit(1);
    }
    
    console.log('Found user:', user.email);
    
    // Find or create SUPER_ADMIN role
    let superAdminRole = await prisma.role.findUnique({
      where: { name: 'SUPER_ADMIN' }
    });
    
    if (!superAdminRole) {
      superAdminRole = await prisma.role.create({
        data: { name: 'SUPER_ADMIN', description: 'Full administrator with infrastructure access' }
      });
      console.log('Created SUPER_ADMIN role');
    }
    
    // Check if user already has this role
    const hasRole = user.roles.some(r => r.roleId === superAdminRole.id);
    
    if (hasRole) {
      console.log('User already has SUPER_ADMIN role');
    } else {
      // Add role to user
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: superAdminRole.id
        }
      });
      console.log('✓ Successfully assigned SUPER_ADMIN role to', user.email);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();

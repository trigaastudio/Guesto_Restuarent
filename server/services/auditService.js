import AuditLog from '../models/auditLogSchema.js';

export const logAdminAction = async (req, action, resource, resourceId = null, details = {}) => {
  try {
    let actionSource = 'outside';
    let userId = null;

    if (req.user) {
      userId = req.user._id;
      
      
      
      const role = req.user.role ? req.user.role.toLowerCase() : 'user';
      
      const validSources = ['user', 'admin', 'staff', 'waiter', 'kitchen', 'delivery', 'outside'];
      
      
      if (validSources.includes(role)) {
        actionSource = role;
      } else if (req.user.employeeId) {
        actionSource = 'staff';
      } else {
        actionSource = 'user';
      }
    }

    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;

    await AuditLog.create({
      userId,
      actionSource,
      action,
      resource,
      resourceId,
      details,
      ipAddress: req.ip || req.connection.remoteAddress,
      date: formattedDate
    });
  } catch (error) {
    
    console.error('Failed to write audit log:', error);
  }
};

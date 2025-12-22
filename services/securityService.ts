// Enhanced Security Service for Data Operations
// This service adds authentication, rate limiting, and audit logging

import { UserProfile } from '../types';

interface AuditLog {
  userId: string;
  userEmail: string;
  action: 'CLEAR_ALL' | 'RESET_DATA' | 'DELETE_TRANSACTION' | 'DELETE_GOAL' | 'DELETE_BUDGET';
  timestamp: Date;
  itemCount: number;
  success: boolean;
  errorMessage?: string;
}

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

class SecurityService {
  private static instance: SecurityService;
  private auditLogs: AuditLog[] = [];
  
  // Rate limiting configuration
  private rateLimits: Record<string, RateLimitConfig> = {
    CLEAR_ALL: { maxAttempts: 1, windowMs: 3600000 }, // 1 per hour
    RESET_DATA: { maxAttempts: 3, windowMs: 3600000 }, // 3 per hour
    DELETE_TRANSACTION: { maxAttempts: 100, windowMs: 3600000 }, // 100 per hour
  };

  private constructor() {
    this.loadAuditLogs();
  }

  static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  /**
   * Verify user is authenticated before allowing destructive operations
   */
  verifyAuthentication(userProfile: UserProfile | null): boolean {
    if (!userProfile || !userProfile.email) {
      console.warn('Security: Attempted destructive operation without authentication');
      return false;
    }
    return true;
  }

  /**
   * Check if operation is allowed based on rate limiting
   */
  checkRateLimit(action: string, userId: string): { allowed: boolean; retryAfter?: number } {
    const config = this.rateLimits[action];
    if (!config) {
      return { allowed: true };
    }

    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get recent attempts for this user and action
    const recentAttempts = this.auditLogs.filter(
      log => 
        log.userId === userId && 
        log.action === action && 
        log.timestamp.getTime() > windowStart
    );

    if (recentAttempts.length >= config.maxAttempts) {
      const oldestAttempt = recentAttempts[0];
      const retryAfter = oldestAttempt.timestamp.getTime() + config.windowMs - now;
      
      console.warn(`Security: Rate limit exceeded for ${action} by user ${userId}`);
      return { allowed: false, retryAfter };
    }

    return { allowed: true };
  }

  /**
   * Log destructive operation for audit trail
   */
  logOperation(
    userProfile: UserProfile,
    action: AuditLog['action'],
    itemCount: number,
    success: boolean,
    errorMessage?: string
  ): void {
    const log: AuditLog = {
      userId: userProfile.email || 'unknown',
      userEmail: userProfile.email || 'unknown',
      action,
      timestamp: new Date(),
      itemCount,
      success,
      errorMessage
    };

    this.auditLogs.push(log);
    this.saveAuditLogs();

    // Log to console for debugging
    console.log('Security Audit:', log);
  }

  /**
   * Get audit logs for a specific user
   */
  getUserAuditLogs(userId: string, limit: number = 50): AuditLog[] {
    return this.auditLogs
      .filter(log => log.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get all audit logs (admin only)
   */
  getAllAuditLogs(limit: number = 100): AuditLog[] {
    return this.auditLogs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Create backup before destructive operation
   */
  createBackup(data: {
    expenses: any[];
    recurringExpenses: any[];
    goals: any[];
    budgets: any[];
    wallets: any[];
  }): string {
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      ...data
    };

    const backupKey = `backup_${Date.now()}`;
    try {
      localStorage.setItem(backupKey, JSON.stringify(backup));
      
      // Keep only last 5 backups to avoid storage issues
      this.cleanOldBackups();
      
      console.log('Security: Backup created:', backupKey);
      return backupKey;
    } catch (error) {
      console.error('Security: Failed to create backup:', error);
      throw new Error('Failed to create backup. Operation aborted for safety.');
    }
  }

  /**
   * Restore from backup
   */
  restoreBackup(backupKey: string): any {
    try {
      const backupData = localStorage.getItem(backupKey);
      if (!backupData) {
        throw new Error('Backup not found');
      }
      return JSON.parse(backupData);
    } catch (error) {
      console.error('Security: Failed to restore backup:', error);
      throw error;
    }
  }

  /**
   * List available backups
   */
  listBackups(): Array<{ key: string; timestamp: string; size: number }> {
    const backups: Array<{ key: string; timestamp: string; size: number }> = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('backup_')) {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            backups.push({
              key,
              timestamp: parsed.timestamp,
              size: data.length
            });
          } catch (e) {
            // Skip invalid backups
          }
        }
      }
    }

    return backups.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Clean old backups, keep only last 5
   */
  private cleanOldBackups(): void {
    const backups = this.listBackups();
    
    // Remove backups older than the 5 most recent
    backups.slice(5).forEach(backup => {
      localStorage.removeItem(backup.key);
      console.log('Security: Removed old backup:', backup.key);
    });
  }

  /**
   * Validate confirmation phrase for critical operations
   */
  validateConfirmation(input: string, expected: string): boolean {
    return input.trim().toUpperCase() === expected.toUpperCase();
  }

  /**
   * Generate secure confirmation token
   */
  generateConfirmationToken(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  /**
   * Save audit logs to localStorage
   */
  private saveAuditLogs(): void {
    try {
      // Keep only last 1000 logs to avoid storage issues
      const logsToSave = this.auditLogs.slice(-1000);
      localStorage.setItem('security_audit_logs', JSON.stringify(logsToSave));
    } catch (error) {
      console.error('Security: Failed to save audit logs:', error);
    }
  }

  /**
   * Load audit logs from localStorage
   */
  private loadAuditLogs(): void {
    try {
      const stored = localStorage.getItem('security_audit_logs');
      if (stored) {
        const logs = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        this.auditLogs = logs.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
      }
    } catch (error) {
      console.error('Security: Failed to load audit logs:', error);
      this.auditLogs = [];
    }
  }

  /**
   * Export audit logs as CSV
   */
  exportAuditLogs(): string {
    const headers = ['Timestamp', 'User Email', 'Action', 'Item Count', 'Success', 'Error'];
    const rows = this.auditLogs.map(log => [
      log.timestamp.toISOString(),
      log.userEmail,
      log.action,
      log.itemCount.toString(),
      log.success.toString(),
      log.errorMessage || ''
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csv;
  }

  /**
   * Clear audit logs (admin only, requires special confirmation)
   */
  clearAuditLogs(adminToken: string): boolean {
    // In production, verify admin token with backend
    if (adminToken === 'CLEAR_AUDIT_LOGS_CONFIRMED') {
      this.auditLogs = [];
      this.saveAuditLogs();
      return true;
    }
    return false;
  }
}

export const securityService = SecurityService.getInstance();
export default securityService;

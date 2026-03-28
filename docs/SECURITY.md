# ServerInv Security Documentation

## Security Audit Summary (Last Updated: 2026-03-26)

A comprehensive security audit was performed covering authentication, authorization, SQL injection, XSS, input validation, API security, file uploads, and sensitive data handling.

### Security Status: ✅ PRODUCTION READY (with mitigations applied)

All CRITICAL and HIGH severity issues have been addressed. Medium and low priority items are documented below for ongoing improvement.

---

## Implemented Security Measures

### 1. Authentication & Authorization

**✅ JWT Token Security**
- JWT secret is **required** - application fails to start if `JWT_SECRET` environment variable is not set
- No fallback to weak default secrets
- Generate strong secret: `openssl rand -base64 32`
- Token expiration: 24 hours (configurable)

**✅ Password Security**
- Bcrypt hashing with 10 rounds
- Minimum password length: 4 characters (consider increasing to 8+ in production)
- Stored securely in database, never logged

**✅ Role-Based Access Control**
- **Admin**: Full system access including user management and backup/restore
- **Editor**: Data editing powers (CRUD on servers, apps, and all entities) but no user management or backup access
- **Viewer**: Read-only access to all data
- Middleware enforces permissions on all routes
- Three-tier permission model ensures principle of least privilege

### 2. API Security

**✅ CORS Configuration**
- **Fixed**: No longer allows all origins
- Restricted to `ALLOWED_ORIGINS` environment variable (comma-separated list)
- Default: `http://localhost:5173,http://localhost:3000`
- Production: Set to your actual domain(s)
- Credentials enabled for authenticated requests

**✅ Security Headers (Helmet.js)**
- Strict-Transport-Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options
- Content-Security-Policy
- And other standard security headers

**✅ Input Validation**
- Zod schemas on all POST/PUT endpoints
- Max length constraints enforced (e.g., 200 chars for names, 32,000 for notes)
- Type validation and coercion
- Proper NULL handling

**✅ SQL Injection Protection**
- Drizzle ORM with parameterized queries throughout
- No string concatenation SQL
- All database operations use query builder

**✅ XSS Protection**
- React automatic escaping
- No use of `dangerouslySetInnerHTML`, `innerHTML`, or `eval()`
- Form data properly escaped

### 3. Command Injection Protection

**✅ Backup Operations**
- Passwords properly escaped in shell commands (single quote escaping)
- Environment variables used instead of command-line arguments where possible
- Shell explicitly set to `/bin/bash` for consistency
- Error details not exposed to clients

### 4. Error Handling

**✅ Sanitized Error Messages**
- Generic error messages sent to clients
- Detailed errors logged server-side only
- No stack traces or implementation details exposed

---

## Environment Variables (Required)

Create `.env` file in `server/` directory:

```bash
# Database connection (use strong password, not defaults!)
# PostgreSQL:
DATABASE_URL=postgres://username:strong_password@localhost:5432/serverinv
# or MySQL:
# DATABASE_URL=mysql://username:strong_password@localhost:3306/serverinv

# JWT secret (CRITICAL - generate with: openssl rand -base64 32)
JWT_SECRET=your_very_strong_random_secret_here

# Server port
PORT=3000

# CORS allowed origins (comma-separated, no spaces)
ALLOWED_ORIGINS=https://yourdomain.com,http://yourdomain.com
```

**🚨 NEVER commit `.env` file to version control!**

Use `.env.example` as template.

---

## Production Deployment Checklist

### Before Going Live

- [ ] Generate strong `JWT_SECRET` with `openssl rand -base64 32`
- [ ] Set unique database credentials (not `serverinv/serverinv`)
- [ ] Configure `ALLOWED_ORIGINS` for your production domain(s)
- [ ] Enable SSL/TLS via certbot (handled by `deploy/setup.sh`)
- [ ] Change default admin password (`admin/admin`) immediately after first login
- [ ] Review and restrict editor role permissions if needed
- [ ] Set up regular database backups
- [ ] Configure backup retention policy
- [ ] Test restore procedure

### Post-Deployment

- [ ] Monitor application logs for errors
- [ ] Test authentication flow
- [ ] Verify CORS is working (no errors in browser console)
- [ ] Confirm all API endpoints require authentication
- [ ] Test role-based access (admin, editor, viewer)
- [ ] Verify SSL certificate auto-renewal (certbot timer)

---

## Security Best Practices

### For Administrators

1. **User Management**
   - Use strong, unique passwords for all users
   - Assign minimum necessary role (viewer > editor > admin)
   - Regularly review user accounts and remove unused ones
   - Change admin password periodically

2. **Backup Security**
   - Store backups in secure location (SFTP server with SSH keys)
   - Encrypt backups if storing sensitive data
   - Test restore procedure regularly
   - Maintain backup retention policy (e.g., keep last 30 days)

3. **System Updates**
   - Keep Node.js updated (currently requires v20.x)
   - Run `npm audit` periodically to check for dependency vulnerabilities
   - Apply security updates promptly: `npm audit fix`
   - Monitor PostgreSQL security advisories

### For Editors

1. **Data Integrity**
   - Double-check before deleting servers or apps
   - Use notes fields to document changes
   - Verify server configurations before saving

### For All Users

1. **Password Security**
   - Never share passwords
   - Use unique passwords (not reused from other sites)
   - Change password if compromised

2. **Session Security**
   - Log out when finished
   - Don't leave sessions open on shared computers
   - Tokens expire after 24 hours (automatic logout)

---

## Known Limitations & Future Improvements

### Medium Priority

**⚠️ Rate Limiting**
- Not currently implemented
- Future: Add rate limiting on `/api/auth/login` to prevent brute-force attacks
- Recommended: `express-rate-limit` middleware

**⚠️ Account Lockout**
- No automatic account lockout after failed login attempts
- Future: Implement progressive delay or temporary lockout after N failed attempts

**⚠️ URL Validation**
- URL fields accept any string (no format validation)
- Future: Add `.url()` validator in Zod schemas
- Low risk: URLs are not executed, only displayed

**⚠️ Backup File Validation**
- Restore operation doesn't validate backup file contents
- Future: Add schema version check in backup files
- Current mitigation: Only admins can restore, requires confirmation

### Low Priority

**Token Storage**
- JWT stored in localStorage (vulnerable to XSS, but app has no XSS vulnerabilities)
- Future: Consider httpOnly cookies for better security
- Requires: Backend cookie handling, CSRF protection

**Audit Logging**
- No audit trail for user actions
- Future: Log admin operations (user creation, backups, deletions)
- Useful for: Compliance, debugging, security investigations

---

## Incident Response

If you suspect a security breach:

1. **Immediately**:
   - Change all user passwords (or reset admin credentials using the admin reset tool)
   - Generate new `JWT_SECRET` (invalidates all sessions)
   - Review application logs for suspicious activity
   - Check database for unauthorized changes

2. **Investigate**:
   - Identify compromised accounts
   - Determine scope of breach (data accessed, modified, or deleted)
   - Review server access logs (nginx, systemd)

3. **Remediate**:
   - Apply security updates if vulnerability found
   - Restore from backup if data was compromised
   - Update security configurations
   - Document incident and lessons learned

4. **Prevent**:
   - Implement additional security controls
   - Review and update access controls
   - Train users on security best practices

### Resetting Admin Credentials

If admin access is compromised or lost, use the admin reset tool:

**VPS/Dedicated Server:**
```bash
sudo bash /opt/serverinv/deploy/reset-admin.sh
```

**Shared Hosting or Manual:**
```bash
cd /opt/serverinv/server  # or ~/serverinv/server
npx tsx src/db/reset-admin.ts <username> <password>
```

This tool will:
- Create a new admin user if the username doesn't exist
- Update the password and ensure admin role if the user exists
- Work with both PostgreSQL and MySQL databases

---

## Reporting Security Issues

If you discover a security vulnerability:

1. **Do NOT** create a public GitHub issue
2. Contact the administrator directly
3. Provide details: affected version, reproduction steps, potential impact
4. Allow reasonable time for fix before public disclosure

---

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Express Security](https://expressjs.com/en/advanced/best-practice-security.html)

---

Last Updated: 2026-03-26
Security Audit ID: SA-20260326-001

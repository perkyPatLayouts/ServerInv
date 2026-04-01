# Documentation Updates Summary

## April 2026 - Security Audit & VirtualMin Guide

### New Files Created

1. **`virtualmin-guide.md`** ✅ Complete
   - Comprehensive VirtualMin GPL deployment and management guide
   - Extracted from shared-hosting-guide.md and update-guide.md
   - Covers installation, configuration, management, updates, and troubleshooting

### Files to Update

#### High Priority Updates

1. **`shared-hosting-guide.md`**
   - Remove VirtualMin GPL Deployment section (lines 477-888)
   - Replace with: "For VirtualMin GPL deployment, see the dedicated [VirtualMin Guide](./virtualmin-guide.md)"
   - Update Table of Contents to remove VirtualMin section
   - Update line 14: Change link to point to virtualmin-guide.md
   - Update line 27: Remove "or VirtualMin GPL 6.0+"
   - Update line 98-99: Remove VirtualMin-specific instructions

2. **`update-guide.md`**
   - Line 103-119: Replace VirtualMin Quick Reference with link to virtualmin-guide.md
   - Line 136-153: Move VirtualMin-specific prerequisites to virtualmin-guide.md, add reference
   - Line 192: Change comment to reference virtualmin-guide.md
   - Line 213-256: Replace VirtualMin GPL section with link
   - Line 404, 553, 578, 618, 679: Update VirtualMin references to link to guide

3. **`README.md`** (Root)
   - Update Features section to mention new security features:
     - JWT algorithm enforcement
     - Forced password change for default credentials
     - CSRF protection
   - Add security badge or mention
   - Update deployment options to include VirtualMin guide link

4. **`docs/README.md`** (Documentation Index)
   - Add link to virtualmin-guide.md
   - Update description to mention it's separate from shared hosting guide
   - Reorganize deployment guides section:
     - VPS/Dedicated Server (deployment-guide.md)
     - Shared Hosting - cPanel (shared-hosting-guide.md)
     - Shared Hosting - DirectAdmin (shared-hosting-guide.md)
     - Shared Hosting - VirtualMin GPL (virtualmin-guide.md)

5. **`SECURITY.md`**
   - Add section about April 2026 security audit
   - Document the 6 vulnerabilities fixed:
     1. JWT algorithm vulnerability (CRITICAL) - Fixed
     2. Default password enforcement (HIGH) - Fixed
     3. CSRF token validation (HIGH) - Fixed
     4. Error message sanitization (MEDIUM) - Verified
   - Update security features list
   - Add information about forced password change on first login

#### Medium Priority Updates

6. **`CHANGELOG.md`**
   - Add entry for version 1.1.0+ security update
   - List all security fixes
   - Mention new VirtualMin guide
   - Document breaking change: users must re-login after update

7. **`deployment-guide.md`**
   - Update "Deployment Options" section to mention VirtualMin guide
   - Add note about new security features requiring password change

8. **`user-guide.md`**
   - Add section about forced password change on first login
   - Document CSRF tokens (transparent to users)
   - Update backup/restore screenshots if needed

9. **`DEPLOYMENT-CHECKLIST.md`**
   - Add step: "Change default admin password on first login (enforced)"
   - Add note about JWT_SECRET generation
   - Add CSRF configuration notes

### Security Updates to Document

#### New Security Features (April 2026)

1. **JWT Algorithm Enforcement**
   - Prevents "none" algorithm bypass attacks
   - Explicit HS256 algorithm required
   - No configuration needed (automatic)

2. **Forced Password Change**
   - Default admin credentials must be changed on first login
   - Database migration adds `must_change_password` column
   - New ChangePasswordPage component
   - Users locked out until password changed

3. **CSRF Protection**
   - Double-submit cookie pattern implemented
   - Automatic token generation on login
   - Tokens sent in cookies and X-CSRF-Token header
   - Protects all POST/PUT/PATCH/DELETE operations
   - No user action required (transparent)

4. **Error Message Sanitization**
   - All errors use generic messages to clients
   - Detailed errors only in server logs
   - Prevents database schema leakage

#### Breaking Changes

- **Session Invalidation**: All users must re-login after update (JWT structure changed)
- **Database Migration Required**: Run migrations before starting updated app
- **Default Admin**: Forced to change password on first login
- **CORS Configuration**: X-CSRF-Token header added to allowed headers

#### Migration Steps

For existing deployments:

```bash
# 1. Pull latest code
git pull

# 2. Install new dependencies (cookie-parser)
npm install

# 3. Run database migrations (adds must_change_password column)
cd server
npm run db:migrate

# 4. Rebuild
cd ..
npm run build

# 5. Restart
# VPS: sudo systemctl restart serverinv
# Shared: pm2 restart serverinv

# 6. All users will need to re-login
# 7. Default admin will be forced to change password
```

### Documentation Style Guidelines

When updating docs:
- Use clear, concise language
- Include code examples where applicable
- Add warnings for breaking changes with ⚠️ emoji
- Use checkboxes ✅ for completed steps
- Include troubleshooting for common issues
- Cross-reference related documentation
- Keep table of contents up to date
- Use consistent heading levels
- Include last updated date at bottom

### Testing Checklist

Before finalizing documentation updates:

- [ ] Verify all links work (internal and external)
- [ ] Test all code examples
- [ ] Ensure consistency across guides
- [ ] Check for outdated information
- [ ] Verify security recommendations are current
- [ ] Test procedures on fresh installation
- [ ] Review for clarity and completeness
- [ ] Spell check and grammar check
- [ ] Update version numbers
- [ ] Add "Last Updated" dates

### Next Steps

1. Update shared-hosting-guide.md to reference virtualmin-guide.md
2. Update update-guide.md VirtualMin sections
3. Update README.md with security features
4. Update SECURITY.md with audit results
5. Update CHANGELOG.md
6. Update docs/README.md index
7. Test all documentation links
8. Review for consistency

---

**Document Created**: April 1, 2026
**Last Updated**: April 1, 2026

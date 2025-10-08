# Features Index

This directory contains all feature specifications, implementations, and related documentation organized by feature.

---

## 📂 Directory Structure

Each feature has its own folder with:
- Feature specifications (`feat-{name}.md`)
- Implementation tracking (`{name}-v{version}.md`)
- Guides and plans
- Documentation logs

---

## 🚀 Active Features

### [Auth](/features/auth/)
**Status**: Active  
**Description**: User authentication, onboarding, and billing integration

**Documentation**:
- [feat-auth_onboarding_and_billing.md](/features/auth/feat-auth_onboarding_and_billing.md)

### [Public](/features/public/)
**Status**: Active  
**Description**: Public-facing pages and content

**Documentation**:
- [feat-pricing.md](/features/public/feat-pricing.md)

---

## 🔧 Tech Debt

### [Backend Tech Debt v1.0](/features/techDebt/) ✅
**Status**: Complete (Oct 8, 2025)  
**Description**: Complete TypeScript migration, JWT authentication, and API standardization

**Key Documentation**:
- [START_HERE.md](/features/techDebt/START_HERE.md) - Quick reference
- [techdebt-v1.0.md](/features/techDebt/techdebt-v1.0.md) - Main tracking
- [IMPLEMENTATION_SUMMARY.md](/features/techDebt/IMPLEMENTATION_SUMMARY.md) - Final summary
- [documentation-log.md](/features/techDebt/documentation-log.md) - Complete log

**What Was Achieved**:
- ✅ 100% TypeScript backend
- ✅ JWT authentication implemented
- ✅ Standard response envelopes
- ✅ `/api/v1` versioned routes
- ✅ Database connected (Supabase)
- ✅ RefreshToken table created
- ✅ Comprehensive documentation
- ✅ Local testing passed

**Status**: Ready for production deployment 🚀

---

## 📋 Planning Documents

- [v1.0-bootstrap.mdc](/features/v1.0-bootstrap.mdc) - Initial platform bootstrap

---

## 📚 Documentation Rules

All feature documentation must follow the rules defined in:
- [/.cursor/rules/documentation.mdc](/.cursor/rules/documentation.mdc)

**Key Rules**:
- Feature docs go in `/features/{feature-name}/`
- Backend technical guides go in `/backend/`
- No documentation in project root
- Maintain documentation logs
- Use standard templates

---

## 📊 Feature Status Legend

- 🚀 **Active** - Currently in use/development
- ✅ **Complete** - Finished and deployed
- ⏳ **In Progress** - Being implemented
- ⏸️ **Paused** - Temporarily on hold
- ❌ **Cancelled** - No longer pursuing
- 📦 **Archived** - Moved to archive

---

## 🗂️ Archive

No archived features yet.

When features are retired, they will be moved to `/features/archive/{feature-name}/`

---

## 📝 Adding New Features

When creating a new feature:

1. Create folder: `/features/{feature-name}/`
2. Create spec: `/features/{feature-name}/feat-{feature-name}.md`
3. Create tracking: `/features/{feature-name}/{feature-name}-v1.0.md`
4. Create log: `/features/{feature-name}/documentation-log.md`
5. Update this index file
6. Follow documentation rules in `/.cursor/rules/documentation.mdc`

---

## 🔗 Related Documentation

- [Backend API Rules](/.cursor/rules/backend.mdc)
- [Database Rules](/.cursor/rules/database.mdc)
- [Frontend Rules](/.cursor/rules/frontend.mdc)
- [Documentation Rules](/.cursor/rules/documentation.mdc)

---

**Last Updated**: October 8, 2025


---
trigger: always_on
---

You are my AI pair programmer for a web app built with Nuxt 4, ShadCN UI, and Supabase.

## Project: Teacher Evaluation System for Learning Centers

### Tech Stack
- Frontend: Nuxt 4 + TypeScript + ShadCN UI
- Backend: Supabase (PostgreSQL + Auth + RLS)
- Auth: Supabase Email + Password (Superadmin creates accounts)
- State management: Nuxt composables (`useAuth`, `useSupabase`, etc.)
- Styling: TailwindCSS
- Optional integrations later: n8n for automation

### High-Level Features
1. **Role System**
   - Roles: superadmin, head_sales, sales, head_teaching, teacher
   - Superadmin manages all users and assigns roles
   - Role-based dashboards and permissions via Nuxt middleware

2. **Core Entities**
   - users (auth + profile info)
   - students
   - groups
   - lessons
   - evaluations (teacher assessments)
   - schedules

3. **Data Access**
   - All data stored in Supabase
   - Row Level Security (RLS) policies for role-based access
   - Profiles synced with `auth.users` using user id

4. **Auth Flow**
   - Superadmin can create new users via `supabase.auth.admin.createUser()`
   - Users log in with email/password
   - Role stored in `profiles.role` and/or `user_metadata.role`
   - Global auth state handled with `useAuth()` composable

### Development Conventions
- Use `/composables` for logic (e.g. `useAuth.ts`, `useRole.ts`)
- Use `/middleware` for auth and role-based access guards
- Use `/components/ui` for ShadCN and shared UI
- Use `/pages/dashboard/[role].vue` for each role’s dashboard
- All API calls use the Supabase client (`useSupabase()`)
- Follow clean code patterns and modular folder structure

### Your Role
You should:
- Help architect code and database schema
- Write clean and reusable components
- Use best practices for Nuxt 4 + Supabase integration
- Explain reasoning when suggesting major architectural changes
- Keep UX minimal and professional (dashboard style)

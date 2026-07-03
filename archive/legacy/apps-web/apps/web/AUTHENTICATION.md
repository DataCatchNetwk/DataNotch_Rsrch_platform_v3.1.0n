# Multi-Layered Login & Authentication System

## Overview

A comprehensive authentication system has been implemented for the Health Data Platform with a multi-layered login page, protected routes, and role-based access control.

## Architecture

### Layers Implemented

1. **Layer 1: Background Gradient** - Animated gradient background with glassmorphic effects
2. **Layer 2: Animated Elements** - Floating blob animations for visual appeal
3. **Layer 3: Content Container** - Main card shadow and elevation effects
4. **Layer 4: Header Section** - Logo, title, and branding
5. **Layer 5: Alert Section** - Error messages and notifications
6. **Layer 6: Form Section** - Login form with validation
7. **Layer 7: Footer Section** - Demo credentials and divider
8. **Layer 8: Info Panel** - Side panel with features and benefits

## File Structure

```
apps/web/src/
├── app/
│   ├── login/
│   │   ├── page.tsx              # Login page component
│   │   └── page.module.css       # Multi-layered login styles
│   ├── (dashboard)/
│   │   ├── layout.tsx            # Dashboard layout with user menu
│   │   ├── layout.module.css     # Dashboard layout styles
│   │   └── dashboard/
│   │       ├── page.tsx          # Dashboard page
│   │       └── page.module.css   # Dashboard styles
│   ├── layout.tsx                # Root layout with AuthProvider
│   └── page.tsx                  # Home page (redirects to login/dashboard)
├── context/
│   └── AuthContext.tsx           # Authentication context and hooks
├── components/
│   └── ProtectedRoute.tsx        # Protected route wrapper
├── lib/
│   └── auth.ts                   # Auth API client and token storage
└── .env.local                    # Environment variables
```

## Features

### 1. Multi-Layered Login Page (`/login`)

**Visual Design:**

- Gradient background (purple to pink)
- Animated floating blobs
- Glassmorphic info panel (right side)
- Card-based form with elevation
- Smooth animations and transitions

**Form Elements:**

- Email input with validation
- Password input with show/hide toggle
- Remember me checkbox
- Forgot password link
- Submit button with loading state
- Error alert with dismissable control

**Validation:**

- Email format validation
- Password minimum length (6 characters)
- Real-time error clearing
- User-friendly error messages

### 2. Authentication System

**Auth Context (`AuthContext.tsx`):**

```typescript
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}
```

**Token Management (`auth.ts`):**

- localStorage-based token storage
- Access token and refresh token handling
- User information persistence
- Automatic token retrieval
- Token clearing on logout

### 3. Protected Routes

**ProtectedRoute Component:**

- Redirects unauthenticated users to login
- Supports role-based access control (RBAC)
- Shows loading state while checking auth
- Displays access denied message for insufficient permissions

**Usage:**

```typescript
<ProtectedRoute requiredRoles={['ADMIN']}>
  <AdminPanel />
</ProtectedRoute>
```

### 4. Dashboard Layout

**Features:**

- Sticky header with branding
- User profile dropdown menu
- Role badges display
- Secure logout functionality
- Responsive design
- User email display

**User Menu:**

- Displays logged-in user email
- Shows assigned roles as badges
- Quick logout button
- Click-outside-to-close functionality

### 5. Dashboard Page

**Content:**

- Welcome message with user email
- 6 feature cards (Dashboard, Health Data, Uploads, Taxonomy, Users, Audit)
- User information display
- User ID, email, and roles
- Responsive grid layout

## API Integration

### Authentication Endpoints

**Login:**

```
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "ChangeMe123!"
}

Response:
{
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token",
  "user": {
    "id": "user_id",
    "email": "admin@example.com",
    "roles": ["ADMIN"]
  }
}
```

**Logout:**

```
POST /api/v1/auth/logout
Authorization: Bearer <accessToken>
```

**Refresh Token:**

```
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh_token"
}
```

## Environment Variables

**`.env.local`:**

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

## Usage

### Start the Web Application

```powershell
cd apps/web
pnpm run dev
```

The web app will start on `http://localhost:3000` (or 3001 if 3000 is in use).

### Login Flow

1. **Navigate to login page** (automatic redirects if not authenticated)
2. **Enter credentials:**
   - Email: `admin@example.com`
   - Password: `ChangeMe123!`
3. **Click Sign In** button
4. **Redirected to dashboard** upon successful authentication
5. **Access tokens stored** in localStorage

### Logout Flow

1. Click user profile button in header
2. Click logout button in dropdown
3. Redirected to login page
4. Tokens cleared from localStorage

## Styling Features

### Responsive Design

- Mobile-first approach
- Breakpoints at 768px and 1024px
- Adapts login page layout on mobile
- Hides info panel on screens < 768px

### Animations

- **Slide In:** Card appears with fade and translate animation
- **Bounce:** Logo bounces on page load
- **Float:** Background blobs float smoothly
- **Spin:** Loading spinner rotation
- **Slide Down:** Error alert appearance
- **Slide In Right:** Info panel appearance

### Color Scheme

- Primary: Purple (#667eea) to Pink (#764ba2) gradient
- Background: Light blue (#f5f7fb)
- Text: Dark gray (#1a1a1a)
- Error: Red (#ff6b6b)
- Success elements in the future

## Security Features

### Implemented

1. JWT-based authentication
2. Token storage in localStorage
3. Automatic token inclusion in API requests
4. Secure logout with token clearing
5. Protected route guards
6. Role-based access control

### Recommendations for Production

1. Move tokens to HTTP-only cookies
2. Implement CSRF protection
3. Add rate limiting on login endpoint
4. Implement token refresh mechanism
5. Add password reset functionality
6. Implement multi-factor authentication
7. Add session timeout
8. Implement account lockout after failed attempts

## Component Usage Examples

### Using useAuth Hook

```typescript
'use client';

import { useAuth } from '@/context/AuthContext';

export function MyComponent() {
  const { user, isAuthenticated, logout, login } = useAuth();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <p>Welcome, {user?.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Using ProtectedRoute Component

```typescript
import { ProtectedRoute } from '@/components/ProtectedRoute';

export function AdminPanel() {
  return (
    <ProtectedRoute requiredRoles={['ADMIN']}>
      <div>Admin content only</div>
    </ProtectedRoute>
  );
}
```

## Browser Compatibility

- Chrome/Edge: Latest (with CSS Modules support)
- Firefox: Latest
- Safari: Latest
- Mobile browsers: Responsive design included

## Performance

- CSS modules for scoped styling
- Lazy loading of components
- Minimal re-renders with React hooks
- Efficient animation performance
- Fast token lookup from localStorage

## Testing Credentials

**Admin Account:**

- Email: `admin@example.com`
- Password: `ChangeMe123!`
- Roles: `ADMIN`

These credentials are displayed on the login page for convenience during development.

## Future Enhancements

1. **Password Reset Flow**
   - Email verification
   - Token-based reset links
   - Password strength requirements

2. **Two-Factor Authentication (2FA)**
   - SMS-based OTP
   - Google Authenticator support
   - Backup codes

3. **Social Login**
   - Google OAuth
   - Microsoft OAuth
   - GitHub OAuth

4. **Session Management**
   - Multiple active sessions
   - Device management
   - Activity history

5. **Advanced RBAC**
   - Fine-grained permissions
   - Dynamic role management
   - Permission inheritance

6. **Audit Logging**
   - All login/logout events
   - Failed login attempts
   - Permission changes

## Troubleshooting

### Login Returns 401

- Verify API is running on port 4000
- Check credentials are correct
- Verify database has admin user seed data
- Check network tab for API response

### Styles Not Loading

- Ensure CSS modules are enabled
- Clear browser cache
- Rebuild Next.js: `pnpm run build`
- Check for CSS module syntax errors

### Protected Route Not Redirecting

- Verify AuthProvider wraps the app
- Check token is being stored in localStorage
- Verify useAuth hook is used inside AuthProvider
- Check browser console for errors

### Token Not Persisting

- Verify localStorage is not disabled
- Check browser privacy/incognito mode
- Verify localStorage key names match
- Check for localStorage errors in console

---

**Last Updated:** March 20, 2026
**Version:** 1.0.0

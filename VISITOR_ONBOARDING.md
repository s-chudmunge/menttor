# Onboarding System

## Overview

The onboarding system provides a comprehensive approach to engage both visitors and logged-in users who haven't started their learning journey yet. It appears after 39 seconds and collects learning preferences to generate personalized roadmaps.

### Two Types of Onboarding:
1. **Visitor Onboarding**: For non-logged users to encourage signup
2. **Logged-in User Onboarding**: For authenticated users without any roadmaps

## Components

### VisitorOnboardingForm.tsx
- **Location**: `src/components/VisitorOnboardingForm.tsx`
- **Purpose**: Multi-step form that collects visitor preferences
- **Steps**:
  1. **Interests**: Select topics they want to learn about
  2. **Goal**: Describe their specific learning objective  
  3. **Timeline**: Choose duration and time unit (days/weeks/months)
  4. **Learning Style**: Select preferred learning approach

### VisitorOnboardingTimer.tsx
- **Location**: `src/components/VisitorOnboardingTimer.tsx`
- **Purpose**: Manages timing logic and data persistence for visitors
- **Features**:
  - 39-second timer for non-logged users
  - Session storage to prevent repeated showings
  - Local storage for data persistence across sessions
  - Automatic data save to user profile after login

### LoggedInUserOnboardingForm.tsx
- **Location**: `src/components/LoggedInUserOnboardingForm.tsx`
- **Purpose**: Multi-step form for authenticated users without roadmaps
- **Features**:
  - Same 4-step process as visitor form
  - Direct roadmap generation and saving
  - Immediate redirect to journey page
  - Success confirmation screen

### LoggedInUserOnboardingTimer.tsx
- **Location**: `src/components/LoggedInUserOnboardingTimer.tsx`
- **Purpose**: Manages timing logic for logged-in users
- **Features**:
  - 39-second timer for users without roadmaps
  - Checks user roadmap data before showing
  - Session storage to prevent repeated showings
  - Automatic page refresh after completion

## Integration

The onboarding system is integrated into the root layout (`src/app/layout.tsx`) and wraps all page content, ensuring it appears on any page after the timer expires.

## User Flows

### Visitor Flow (Non-logged Users)
1. **Visitor arrives** on any page while not logged in
2. **Timer starts** counting 39 seconds
3. **Form appears** as a modal overlay (square design, no gradients/purple)
4. **User completes** 4-step onboarding process
5. **Roadmap generates** in the background during completion
6. **Login prompt** appears with generated roadmap preview
7. **Data saves** to user profile upon successful authentication

### Logged-in User Flow (No Roadmaps)
1. **User logs in** and browses site without any existing roadmaps
2. **Timer starts** counting 39 seconds
3. **Form appears** as a modal overlay (same design as visitor version)
4. **User completes** 4-step onboarding process
5. **Preferences save** directly to user profile
6. **Roadmap generates** and saves automatically
7. **Success screen** shows briefly
8. **Auto-redirect** to journey page to start learning

## Storage Strategy

### Visitor Onboarding
- **Session Storage**: Prevents form from showing again in same session
- **Local Storage**: Persists onboarding data until user logs in
- **Backend Save**: Transfers data to user profile after authentication

### Logged-in User Onboarding
- **Session Storage**: Prevents form from showing again in same session
- **Direct Backend Save**: Immediately saves preferences and roadmap to user profile
- **No Local Storage**: Not needed since user is authenticated

## Design Specifications

- ✅ Square-shaped modal (not full screen)
- ✅ No gradients used in styling  
- ✅ No purple colors (replaced with green/blue theme)
- ✅ Clean, minimal design matching site aesthetic
- ✅ Responsive and mobile-friendly

## Technical Details

- Built with **React**, **TypeScript**, and **Framer Motion** for animations
- Uses existing **Tailwind CSS** classes for consistency
- Integrates with existing **authentication system**
- Leverages current **roadmap generation API**
- Follows established **API patterns** and error handling

## Testing

The feature has been tested with:
- ✅ TypeScript compilation
- ✅ Next.js build process
- ✅ Component integration
- ✅ Timer functionality
- ✅ Data persistence flows

## Future Enhancements

- Analytics tracking for conversion rates
- A/B testing for different timings (39s vs others)
- Customizable interest categories
- Enhanced roadmap preview features
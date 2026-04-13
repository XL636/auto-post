# UX Optimization Prompt for Codex

## Project Context
- Next.js 15 App Router + React 19 + Tailwind CSS 4 + next-intl
- Notion-inspired design: white base (#FFFFFF), light gray borders (#E8E8E8), dark text (#37352F), blue accent (#2383E2)
- CSS variables defined in `app/globals.css`, UI primitives in `components/ui/`
- i18n: all user-facing strings use `useTranslations()`, translations in `messages/zh.json` and `messages/en.json`
- Pages under `app/[locale]/`, API under `app/api/`

## Task
Optimize the UX of this social media scheduling app. Execute the following changes in order of priority. For each change, update both zh.json and en.json translation files as needed.

---

## Phase 1: Responsive Layout (Critical - Mobile is Broken)

### 1.1 Collapsible Sidebar
**File:** `shared/components/sidebar.tsx` + `app/[locale]/layout.tsx`

Current: Sidebar is always `w-60` (240px fixed). On mobile it eats half the screen.

Changes needed:
- Add a hamburger button (`<button>` with 3-line icon) visible only on `md:hidden`
- On mobile (<768px): sidebar should be hidden by default, shown as an overlay when hamburger is clicked
- On desktop (>=768px): sidebar remains fixed as-is
- Add a semi-transparent backdrop when mobile sidebar is open, clicking it closes the sidebar
- Use React state `isOpen` with `useState(false)`, close on route change via `usePathname()` in useEffect
- Sidebar overlay: `fixed inset-0 z-40`, backdrop: `fixed inset-0 z-30 bg-black/50`
- The hamburger button should be in a sticky top bar on mobile: `md:hidden fixed top-0 left-0 right-0 z-20 flex items-center h-12 px-4 bg-white border-b`

### 1.2 Responsive Grids
**Files to fix:**

1. `app/[locale]/page.tsx` (Dashboard):
   - Change `grid grid-cols-4 gap-4` → `grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4`

2. `app/[locale]/analytics/page.tsx`:
   - Change `grid grid-cols-5 gap-4` → `grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5 lg:gap-4`

3. `app/[locale]/posts/page.tsx` (Post list rows):
   - On mobile, hide the status badge text and show only the colored dot
   - Hide the date column on mobile, show it on `md:` and above
   - Make the delete button an icon-only button on mobile

4. `app/[locale]/calendar/page.tsx`:
   - On mobile (<md), switch from 7-column grid to a simple list view showing posts per day vertically
   - Each day shows as a collapsible section with date header

---

## Phase 2: Post Creation UX (High Impact)

### 2.1 Real-time Platform Validation in Post Editor
**Files:** `app/[locale]/posts/new/page.tsx`, `app/[locale]/posts/[id]/edit/page.tsx`

Current: Character counter exists but doesn't prevent submission. Platform limits only shown on edit page.

Changes needed:
- Below the textarea, add a "Platform Limits" section showing a compact bar for each selected platform:
  ```
  [Platform Icon] [Platform Name] [===========----] 240/280
  ```
- Use a thin progress bar (h-1.5 rounded-full) that is:
  - `bg-[var(--accent-green)]` when under 80%
  - `bg-[var(--accent-orange)]` when 80-100%  
  - `bg-[var(--accent-red)]` when over 100%
- When ANY selected platform exceeds its limit, the "Publish Now" button should show a warning tooltip (title attribute): "Content exceeds character limit for [Platform]"
- Do NOT disable the button (user might want to publish to platforms that are under limit), but show the warning clearly
- Platform limits reference (already defined in edit page as PLATFORM_LIMITS):
  - Twitter: 280, LinkedIn: 3000, Facebook: 63206, Discord: 2000, Reddit: 40000, YouTube: 5000

### 2.2 Timezone Indicator for Schedule Input
**Files:** `app/[locale]/posts/new/page.tsx`, `app/[locale]/posts/[id]/edit/page.tsx`

Current: `<Input type="datetime-local">` with no timezone context.

Changes:
- Below the datetime input, add a small text showing the user's timezone:
  ```tsx
  <p className="mt-1 text-xs text-[var(--text-tertiary)]">
    {t("timezoneHint", { tz: Intl.DateTimeFormat().resolvedOptions().timeZone })}
  </p>
  ```
- Add client-side validation: if `scheduledAt` is in the past, show red text below: "Scheduled time is in the past"
- Add translation keys for both languages

### 2.3 Improved Media Upload
**File:** `app/[locale]/posts/new/page.tsx`

Current: Plain `<input type="file">` with no drag-drop, no progress indication.

Changes:
- Replace the file input with a drop zone area:
  - Default state: dashed border box (`border-2 border-dashed border-[var(--border-color)] rounded-[4px] p-6 text-center`) with upload icon and text "Drop files here or click to upload"
  - Drag-over state: `border-[var(--accent-blue)] bg-blue-50`
  - Use `onDragOver`, `onDragLeave`, `onDrop` events on the container div
  - Keep the hidden `<input type="file">` triggered by clicking the drop zone
- During upload, show a small inline progress text per file being uploaded: "[filename] uploading..." with a simple animated dot
- After upload, show image thumbnails in a grid (current behavior is fine, keep it)

### 2.4 Clearer Action Buttons
**File:** `app/[locale]/posts/new/page.tsx`

Current: "Schedule Send" and "Save Draft" share one button that changes label based on scheduledAt. Confusing.

Changes:
- Always show 3 distinct buttons:
  1. "Publish Now" (primary blue, leftmost) - only enabled when content + accounts selected
  2. "Schedule" (outline style) - only enabled when content + accounts + scheduledAt filled, disabled with tooltip "Set a schedule time first" if no scheduledAt
  3. "Save Draft" (ghost/text style, rightmost) - always enabled when content exists
- This removes the ambiguity of a context-dependent button label

---

## Phase 3: Account Management UX

### 3.1 Guided Connection Flow
**File:** `app/[locale]/accounts/page.tsx`

Current: When credentials are missing, user gets a toast error and is redirected to `/settings/platforms`. No context provided.

Changes:
- Instead of immediately redirecting, show an inline alert box below the platform card that was clicked:
  ```html
  <div className="mt-2 rounded border border-[var(--accent-orange)]/30 bg-orange-50 p-3 text-sm">
    <p className="font-medium text-[var(--accent-orange)]">{t("credentialsNeeded")}</p>
    <p className="mt-1 text-[var(--text-secondary)]">{t("credentialsNeededDesc", { platform })}</p>
    <Link href={`/settings/platforms?platform=${platform}`} className="mt-2 inline-block text-sm font-medium text-[var(--accent-blue)] hover:underline">
      {t("setupCredentials")} →
    </Link>
  </div>
  ```
- Use a state variable `alertPlatform` to track which platform's alert is shown
- This keeps the user in context instead of jarring redirect

### 3.2 Account Status Action Buttons
**File:** `app/[locale]/accounts/page.tsx`

Current: Status badges show "EXPIRED", "MISCONFIGURED" etc. with no action to fix.

Changes:
- For accounts with status "EXPIRED" or "EXPIRING_SOON": show a "Reconnect" button next to the disconnect button
  - Style: `text-sm font-medium text-[var(--accent-blue)] hover:underline`
  - onClick: trigger the same OAuth flow as initial connection (`window.location.href = /api/oauth/${platform}`)
- For accounts with status "MISCONFIGURED": show "Fix Credentials" link pointing to `/settings/platforms?platform=${platform}`
- For accounts with `lastError`: show the error message in a collapsible detail (click to expand) instead of tiny truncated text

### 3.3 Better Disconnect UX  
**File:** `app/[locale]/accounts/page.tsx`

Current: When account has linked posts, disconnect button is disabled with no explanation visible.

Changes:
- When `linkedPostCount > 0`, show a tooltip (title attribute) on the disabled disconnect button: "Cannot disconnect: {count} posts use this account. Delete or reassign them first."
- Change the disabled button style to show a small info icon (ℹ) next to "Disconnect"

---

## Phase 4: Feedback & Polish

### 4.1 Replace Native confirm() with Custom Dialog
**New file:** `components/ui/confirm-dialog.tsx`

Create a minimal confirm dialog component:
```tsx
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  onConfirm: () => void;
  onCancel: () => void;
}
```
- Render as a portal over the app
- Backdrop: `fixed inset-0 z-50 bg-black/50` with `onClick={onCancel}`
- Dialog: `fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-lg bg-white p-6 shadow-lg`
- Focus trap: auto-focus the cancel button on open
- Close on Escape key
- Destructive variant: confirm button uses `bg-[var(--accent-red)]`

Then replace ALL `confirm()` calls across these files:
- `app/[locale]/posts/page.tsx` (bulk delete, bulk publish, individual delete)
- `app/[locale]/posts/[id]/edit/page.tsx` (delete)
- `app/[locale]/accounts/page.tsx` (disconnect)

Use a custom hook `useConfirmDialog()` that returns `{ dialog, confirm }` where `confirm(options)` returns a Promise<boolean>.

### 4.2 Loading Skeletons
**New file:** `components/ui/skeleton.tsx`

Create a skeleton component:
```tsx
function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-[var(--bg-secondary)]", className)} />;
}
```

Then replace "Loading..." text in these pages:
1. **Dashboard** (`page.tsx`): 4 skeleton cards (h-20) + 5 skeleton rows (h-12)
2. **Posts list** (`posts/page.tsx`): 5 skeleton rows (h-16) with checkbox placeholder
3. **Accounts** (`accounts/page.tsx`): 3 skeleton cards (h-24) in grid
4. **Analytics** (`analytics/page.tsx`): 5 skeleton metric cards + skeleton chart area (h-64)
5. **Calendar** (`calendar/page.tsx`): skeleton 7-column grid with cell placeholders

### 4.3 Enhanced Empty States
**Files:** Dashboard, Posts list, Drafts, Accounts, Analytics

Current: Simple text like "No posts yet."

Changes - for each empty state, add:
- A simple SVG illustration (use a minimal line-art style, max 80x80px viewBox, gray stroke color)
- Descriptive text explaining what this section is for
- A primary action button (CTA) that takes the user to the logical next step:
  - Dashboard empty → "Create your first post" button → `/posts/new`
  - Posts empty → "Create a post" button → `/posts/new`  
  - Drafts empty → "Start writing" button → `/posts/new`
  - Accounts empty → already has connect button (keep it)
  - Analytics empty → "Connect accounts and publish posts to see analytics" (informational, link to `/accounts`)

### 4.4 Post List: Failed Post Indicator
**File:** `app/[locale]/posts/page.tsx`

Current: Failed posts show a red "FAILED" badge but no error reason in the list.

Changes:
- For posts with status "FAILED", show the error message below the content text in the list row:
  ```html
  <p className="mt-0.5 text-xs text-[var(--accent-red)]">{post.platforms[0]?.errorMessage}</p>
  ```
- Add a "Retry" button (small, outline style) at the end of failed post rows that calls POST `/api/posts/${id}/publish`
- This creates the "Failed Stream" pattern that Sprout Social popularized

---

## Phase 5: Settings & Credentials Polish

### 5.1 Credential Page Improvements
**File:** `app/[locale]/settings/platforms/page.tsx`

Changes:
- Add a "Copy" button next to callback URLs (currently shown in a code block with no copy action):
  ```tsx
  <button onClick={() => { navigator.clipboard.writeText(url); toast.success(t("copied")); }}>
    {t("copy")}
  </button>
  ```
- Add a brief help text per platform explaining where to get credentials:
  - LinkedIn: "Create an app at linkedin.com/developers"
  - Twitter: "Create a project at developer.x.com"
  - Facebook: "Create an app at developers.facebook.com"
  - Discord: "Create a bot at discord.com/developers"
  - YouTube: "Enable YouTube Data API at console.cloud.google.com"
  - Reddit: "Create an app at reddit.com/prefs/apps"
- Show this as a small `text-xs text-[var(--text-tertiary)]` line below each platform section header

### 5.2 Credential Source Clarity
**File:** `app/[locale]/settings/platforms/page.tsx`

Current: Shows "From env" / "Saved in app" / "Needs setup" pills but meaning is unclear.

Changes:
- Rename labels:
  - "From env" → "Using server config" (with tooltip: "These credentials are set in the server environment variables")
  - "Saved in app" → "Custom credentials"
  - "Needs setup" → "Not configured"
- When source is "env", show a small lock icon before the label to indicate it's managed externally and readonly

---

## Implementation Notes

1. **Translation keys**: For every new user-facing string, add entries to both `messages/zh.json` and `messages/en.json`. Follow existing key naming patterns (camelCase, nested by page).

2. **No new dependencies**: Implement all UI components from scratch using Tailwind CSS. Do NOT install shadcn/ui, Radix, or any component library.

3. **Design tokens**: Use the existing CSS variables from `app/globals.css` (--accent-blue, --accent-red, --accent-orange, --bg-secondary, --border-color, etc.). Do not hardcode hex colors.

4. **Existing patterns**: Follow the existing code patterns:
   - SWR for data fetching via hooks in `shared/hooks/`
   - Sonner for toast notifications
   - next-intl `useTranslations()` for i18n
   - `@/i18n/navigation` for locale-aware Links and routing

5. **File organization**: 
   - New UI primitives go in `components/ui/`
   - New shared components go in `shared/components/`
   - Keep page components in their existing locations

6. **Do not touch**: Backend API routes, database schema, BullMQ workers, platform client implementations. This is purely a frontend UX optimization.

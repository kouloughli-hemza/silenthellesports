# Silent Hell Esports — Claude Code Build Spec

You are building the **production website** for Silent Hell Esports, a competitive PUBG Mobile team based in Algeria. A complete design handoff bundle from Claude Design exists at `silenthell-design/` — it contains pixel-perfect HTML/CSS/JSX prototypes that are the **source of truth for visual design**. Read `silenthell-design/README.md` first, then `silenthell-design/project/Silent Hell Esports.html` and follow its imports.

This document is the source of truth for **everything else**: stack, architecture, data, integrations, quality bar, and delivery phases.

---

## 1. Project Overview

A site for an Algerian esports team with five public sections (Home, Roster, Store, Events, Giveaways) and a full admin dashboard for content management. Audience is primarily Algerian, primarily mobile, primarily Arabic and English speakers. Payments are **cash on delivery only** via the Yalidine shipping API — there is no online payment processing.

### Core capabilities
- Public-facing brand site with cinematic design
- Merchandise store with COD checkout (Yalidine handles payment collection)
- Event signup system with capacity enforcement
- Giveaway system with entry tracking
- Admin dashboard for managing every piece of content
- Bilingual: English + Arabic with RTL layout
- SEO-optimized for esports search terms

---

## 2. Tech Stack — LOCKED

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15** (App Router) | SSR for SEO, server actions for safe Yalidine calls, route handlers for webhooks |
| Language | **TypeScript** strict mode | Catches errors at compile time, no `any` allowed |
| Styling | **Tailwind CSS v4** | Matches design tokens directly via CSS variables |
| Database | **Supabase Postgres** | Postgres + auth + storage + RLS in one |
| Auth | **Supabase Auth** | Email/password for admin, optional magic link for customers |
| Storage | **Supabase Storage** | Product images, player photos, giveaway assets |
| Validation | **Zod** | Runtime validation for all forms and API responses |
| Forms | **React Hook Form** + Zod resolver | Best DX, strong typing |
| Tables/UI | **shadcn/ui** | Admin dashboard tables, dialogs, forms |
| Icons | **lucide-react** | Already in design bundle |
| Hosting | **Vercel** | Free tier ample, native Next.js, fast in MENA |
| Shipping | **Yalidine API** via `yalidine` npm package | Algerian COD logistics |
| Email | **Resend** | Order confirmations, event signup confirmations |
| Error tracking | **Sentry** | Production observability |
| Analytics | **Vercel Analytics** + **PostHog** (optional) | Privacy-friendly |

**Do NOT use:** Laravel, PHP, MongoDB, Firebase, any payment gateway, localStorage for sensitive data, `any` type.

---

## 3. Design System — LOCKED

The design bundle at `silenthell-design/project/` is the visual source of truth. Reproduce it pixel-perfectly. Translate the prototype's React/Babel/CDN setup into proper Next.js components — match the *output*, not the prototype's structure.

### Design tokens (already defined in `styles.css`)
```
--black: #0A0A0A
--hell-red: #E60013
--ember: #FF4500
--bone: #F5F0E8
--ash-1: #1F1F1F
--ash-2: #2A2A2A
--ash-3: #141414
```

### Fonts
- Display (English): **Saira Condensed** italic
- Body (English): **Inter**
- Mono (numbers/stats): **JetBrains Mono**
- Display (Arabic): **Reem Kufi**
- Body (Arabic): **Cairo**

Load via `next/font` for optimal performance — do not use Google Fonts CDN imports in production.

### Components to extract from the bundle
- `SkullIcon` — flaming skull SVG
- `CustomCursor` — desktop-only red cursor with ember trail
- `EmberField` — animated particle background
- `CountUp` — intersection-observer-triggered number animation
- `SectionHeading` — label + giant title pattern
- `PlaceholderImage` — replace with `next/image` for production

### Sections to build
Hero, RosterStrip, TrophyCase, SocialsBlock, EventsSection, StoreSection, GiveawaysSection, FooterBlock, TopBar — all already designed. Build them as proper Next.js components.

---

## 4. Internationalization

Languages: **English (en) + Arabic (ar)**. No French.

- Use `next-intl` for routing (`/en/...` and `/ar/...`)
- RTL support: when `locale === 'ar'`, set `<html dir="rtl">`
- The design bundle's `i18n.jsx` and `styles.css` already handle RTL typography swaps (Cairo, Reem Kufi) and reverses the diagonal slash dividers — port those rules
- All user-facing strings live in `messages/en.json` and `messages/ar.json`
- Database content (product names, event titles, page bodies) is stored as `{ en: string, ar: string }` JSONB columns
- Admin can edit both translations side-by-side in the dashboard

---

## 5. Database Schema

Full Postgres schema with RLS. Use Supabase migrations.

```sql
-- Users & roles
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  email text unique not null,
  full_name text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz default now()
);

-- Site config (key-value store for hero copy, taglines, social links)
create table site_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- Roster
create table players (
  id uuid primary key default gen_random_uuid(),
  ign text not null,
  real_name text,
  role text not null check (role in ('IGL','Sniper','Fragger','Support','Coach','Manager','Sub')),
  country_code text,
  photo_url text,
  bio jsonb default '{"en":"","ar":""}',
  signature_loadout text,
  stats jsonb default '{}', -- { kd, headshot_pct, matches }
  socials jsonb default '{}', -- { twitch, youtube, x, instagram }
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

-- Trophies / achievements
create table trophies (
  id uuid primary key default gen_random_uuid(),
  title jsonb not null, -- { en, ar }
  tournament_name text not null,
  placement text not null, -- '1st', '2nd', 'Top 4', etc.
  prize_amount numeric,
  prize_currency text default 'USD',
  date date not null,
  logo_url text,
  display_order int default 0
);

-- Events (Room events, customs, tournaments)
create table events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title jsonb not null, -- { en, ar }
  description jsonb default '{"en":"","ar":""}',
  mode text not null check (mode in ('Solo','Duo','Squad')),
  map text,
  prize_pool numeric default 0,
  prize_currency text default 'DZD',
  entry_fee numeric default 0,
  capacity int not null,
  start_at timestamptz not null,
  registration_closes_at timestamptz not null,
  status text not null default 'upcoming' check (status in ('upcoming','open','closed','live','completed','cancelled')),
  cover_image_url text,
  rules jsonb default '{"en":"","ar":""}',
  created_at timestamptz default now()
);

create table event_signups (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events on delete cascade,
  user_id uuid references profiles,
  ign text not null,
  pubg_uid text not null,
  discord_tag text not null,
  contact_phone text not null,
  squad_members jsonb default '[]', -- [{ ign, pubg_uid }]
  payment_status text default 'pending' check (payment_status in ('pending','paid','waived','refunded')),
  status text not null default 'registered' check (status in ('registered','checked_in','disqualified','withdrawn')),
  notes text,
  created_at timestamptz default now(),
  unique(event_id, pubg_uid) -- prevent double-signup
);

-- Store
create table products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name jsonb not null, -- { en, ar }
  description jsonb default '{"en":"","ar":""}',
  category text not null, -- 'tee','hoodie','jersey','mousepad','cap','sticker','lanyard','other'
  base_price numeric not null, -- in DZD
  worn_by_player_id uuid references players,
  images text[] not null default '{}', -- array of supabase storage URLs
  is_active boolean not null default true,
  is_featured boolean default false,
  weight_grams int default 500,
  display_order int default 0,
  created_at timestamptz default now()
);

create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products on delete cascade,
  sku text unique not null,
  size text, -- 'S','M','L','XL','2XL', or null for one-size
  color text,
  price_override numeric, -- if null, use product.base_price
  stock_quantity int not null default 0,
  is_active boolean default true
);

-- Orders
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null, -- e.g., 'SH-2026-0042'
  user_id uuid references profiles,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  shipping_wilaya_code int not null, -- Algerian province code (1-58)
  shipping_commune_name text not null,
  shipping_address text not null,
  is_stopdesk boolean default false, -- pickup at Yalidine office vs home delivery
  stopdesk_id int, -- if is_stopdesk
  subtotal numeric not null,
  shipping_fee numeric not null,
  total numeric not null,
  currency text default 'DZD',
  status text not null default 'pending' check (status in (
    'pending','confirmed','shipped','delivered','cancelled','returned'
  )),
  yalidine_tracking text, -- 'yal-XXXXXX' from Yalidine after shipment created
  yalidine_status text, -- mirrored from Yalidine webhook
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders on delete cascade,
  product_id uuid not null references products,
  variant_id uuid references product_variants,
  product_name_snapshot text not null, -- snapshot at time of order
  variant_label_snapshot text,
  quantity int not null,
  unit_price numeric not null,
  line_total numeric not null
);

-- Giveaways
create table giveaways (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title jsonb not null, -- { en, ar }
  description jsonb default '{"en":"","ar":""}',
  prize_description jsonb not null,
  prize_image_url text,
  entry_methods jsonb not null default '[]',
    -- [{ type: 'follow_x'|'join_discord'|'subscribe_youtube'|'share', label, url, weight }]
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'upcoming' check (status in ('upcoming','active','drawing','completed')),
  winner_user_id uuid references profiles,
  winner_announcement jsonb default '{"en":"","ar":""}',
  created_at timestamptz default now()
);

create table giveaway_entries (
  id uuid primary key default gen_random_uuid(),
  giveaway_id uuid not null references giveaways on delete cascade,
  user_id uuid references profiles,
  email text not null,
  discord_tag text,
  completed_methods jsonb default '[]', -- array of method types completed
  entry_count int default 1, -- weighted entries
  created_at timestamptz default now(),
  unique(giveaway_id, email)
);

-- CMS pages (about, terms, privacy, custom pages)
create table pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title jsonb not null,
  body jsonb not null, -- markdown content { en, ar }
  is_published boolean default false,
  meta_description jsonb default '{"en":"","ar":""}',
  updated_at timestamptz default now()
);

-- Indexes
create index idx_events_status_start on events(status, start_at);
create index idx_event_signups_event on event_signups(event_id);
create index idx_orders_user on orders(user_id);
create index idx_orders_status on orders(status);
create index idx_products_active on products(is_active, display_order);
create index idx_giveaway_entries_giveaway on giveaway_entries(giveaway_id);
```

### Row-Level Security (RLS)
Enable RLS on every table. Policies:

- **`profiles`**: users read own row; admins read all
- **`players`, `trophies`, `pages` (published only)**: public read; admin all
- **`events` (status != 'cancelled')**: public read; admin all
- **`event_signups`**: user reads own; admin all; insert allowed by anon if event is `open`
- **`products` (is_active=true), `product_variants` (is_active=true)`**: public read; admin all
- **`orders`, `order_items`**: user reads own; admin all
- **`giveaways` (status != 'upcoming' OR public preview)**: public read; admin all
- **`giveaway_entries`**: user reads own; admin all; insert by anon
- **`site_config`**: public read; admin write

Write all policies as proper Postgres RLS — do NOT rely on application-level auth checks alone.

### Database constraints to enforce business rules
- Trigger that **rejects** new `event_signups` if `(select count(*) from event_signups where event_id = NEW.event_id) >= events.capacity` — prevents oversells at the database level, not the application level
- Trigger that auto-updates `events.status` to `closed` when `registration_closes_at` passes
- Trigger that prevents `product_variants.stock_quantity` from going negative

---

## 6. Liquipedia Data Seeding

Pull initial roster, trophies, and team metadata from Liquipedia using their MediaWiki API.

**Source:** `https://liquipedia.net/pubgmobile/Silent_Hell_Esports`
**API endpoint:** `https://liquipedia.net/pubgmobile/api.php?action=parse&page=Silent_Hell_Esports&format=json&prop=wikitext`

Build a one-shot seeder script at `scripts/seed-from-liquipedia.ts` that:

1. Fetches the wikitext via the MediaWiki API (respect their rate limits — 1 request/2s, set User-Agent header per their TOS)
2. Parses the **infobox** for team metadata (founded date, region, social links)
3. Parses the **roster table** for active players (IGN, role, country, real name where available)
4. Parses the **achievements table** for trophies (tournament, placement, date, prize)
5. Inserts into Supabase via the service-role client
6. Idempotent: re-running should `upsert`, not duplicate

Make this a one-time run — production data lives in Supabase, edited via the admin dashboard. The seeder is for initial bootstrap and disaster recovery only.

If Liquipedia data is sparse or missing, the seeder should log warnings, insert what it can, and let the admin fill the rest manually via the dashboard.

---

## 7. Public Site — Feature Specs

### `/[locale]` — Home
- Hero with logo, animated entrance, ember field, tagline (editable in `site_config`)
- CTAs: "Join Discord" (primary), "View Events" (secondary)
- Live ticker: next match countdown, current tournament, latest result — pulled from `events` and `trophies`
- Roster preview strip: horizontal scroll of active players, hover reveals callsign
- Trophy case: top 6 trophies by date desc
- Socials block: Twitch live status (use Twitch Helix API with team channels in `site_config`), latest YouTube thumbnails, X feed embed
- Footer: full logo, Discord CTA, sponsor logos, social icons, language switcher

### `/[locale]/roster`
- Grid of all active players
- Click a card → `/[locale]/roster/[ign]` with full profile, signature loadout, K/D, headshot %, socials, "Shop their gear" → store filter

### `/[locale]/store`
- Filterable grid: category, price, "worn by player"
- Each card: image (hover for alt angle), name, price in DZD
- Click → `/[locale]/store/[slug]` — gallery, size selector, "add to cart"
- Cart persists in cookies (server-side cart for authed users, anonymous cart for guests)

### `/[locale]/store/checkout` — COD only
1. Cart review
2. Customer info: name, phone (Algerian validation: starts with 0, 10 digits), email (optional)
3. Shipping address: wilaya dropdown (58 wilayas, fetched from Yalidine and cached), commune dropdown (filtered by wilaya), street address
4. Delivery method: home delivery OR pickup at Yalidine stopdesk (show stopdesk list filtered by wilaya)
5. **Live shipping fee calculation** — call Yalidine fee API server-side, show fee + total before submit
6. Confirm → creates `orders` row with status `pending`, sends customer SMS/email, sends admin notification
7. Admin reviews and confirms → triggers Yalidine shipment creation → status → `confirmed` → tracking returned
8. **No online payment.** Customer pays the Yalidine driver in cash on delivery.

### `/[locale]/events`
- Tabs: Upcoming / Past / All
- Each event card: cover, title, date, mode badge, map, prize pool, entry fee, **live slot counter with red progress bar**, "Sign Up" button (disabled if closed/full)
- Click → `/[locale]/events/[slug]` — full event page with rules, prize breakdown, signup modal
- Signup form: IGN, PUBG UID, Discord, phone, squad members (if Duo/Squad mode)
- Server action validates capacity (DB trigger is the final guard) and inserts row
- Email confirmation with event details
- For paid events: payment status starts `pending`, admin marks `paid` after manual confirmation (or via Yalidine if shipping a prize)

### `/[locale]/giveaways`
- Active giveaway hero with prize image, countdown, entry counter
- Entry methods checklist — each links out, marks complete after the user confirms
- Authed users: persistent entry tracking
- Anonymous users: email-based entry
- Past winners gallery for trust
- Admin draws winner via dashboard (random selection from completed entries, weighted by `entry_count`)

### `/[locale]/account` (customer)
- Order history, event signups, giveaway entries
- Update profile

---

## 8. Admin Dashboard — `/admin`

Auth-gated. Only users with `profiles.role = 'admin'` can access. Server-side check on every page + RLS.

### Routes
- `/admin` — overview: today's orders, pending signups, active giveaways, recent activity
- `/admin/roster` — CRUD for `players`
- `/admin/trophies` — CRUD for `trophies`
- `/admin/events` — CRUD for `events`, view signups per event, mark payments, export CSV
- `/admin/store/products` — CRUD for `products` and `product_variants`, image upload
- `/admin/store/orders` — order list, detail view, "Create Yalidine shipment" button, status management
- `/admin/giveaways` — CRUD for `giveaways`, view entries, "Draw winner" action
- `/admin/pages` — CRUD for `pages`, markdown editor with live preview
- `/admin/site-config` — edit hero copy, tagline, social links, sponsor logos, Discord URL
- `/admin/users` — list profiles, promote to admin

### UX requirements
- Use **shadcn/ui** Table, Dialog, Form, Toast components
- All forms validated with Zod, errors shown inline
- All mutations use server actions, optimistic updates where safe
- Image uploads go to Supabase Storage; show upload progress, validate file size (max 5MB) and type
- All destructive actions show confirmation dialog with required text input ("Type 'DELETE' to confirm")
- Activity log: every admin action writes to an `admin_audit_log` table (add this to the schema)
- All tables are sortable, filterable, paginated server-side

---

## 9. Yalidine Integration

**Wrap everything behind a single `YalidineService` interface so it's swappable and mockable.**

### Setup
```bash
npm install yalidine
```

### Service interface (`/src/services/yalidine/index.ts`)
```typescript
export interface YalidineService {
  // Reference data (cache 24h)
  getWilayas(): Promise<Wilaya[]>;
  getCommunes(wilayaCode: number): Promise<Commune[]>;
  getStopdesks(wilayaCode?: number): Promise<Stopdesk[]>;

  // Fees (call before showing checkout total)
  calculateFee(params: {
    fromWilayaCode: number;
    toWilayaCode: number;
    weight: number;
    isStopdesk: boolean;
  }): Promise<{ home: number; stopdesk: number }>;

  // Shipments
  createParcel(order: Order): Promise<{ tracking: string; importId: number }>;
  getParcel(tracking: string): Promise<ParcelStatus>;
  cancelParcel(tracking: string): Promise<void>;
}
```

### Implementations
1. **`MockYalidineService`** — returns static data so the app works end-to-end without API credentials. Use this until the team has real credentials. **The site must be fully functional with mock mode** — admins can place orders, see "shipments created" with mock tracking numbers, etc.
2. **`RealYalidineService`** — uses the `yalidine` npm package, only enabled when `YALIDINE_API_ID` and `YALIDINE_API_TOKEN` env vars are set.

### Switching
```typescript
export const yalidine: YalidineService =
  process.env.YALIDINE_API_ID && process.env.YALIDINE_API_TOKEN
    ? new RealYalidineService()
    : new MockYalidineService();
```

### Critical rules
- **All Yalidine calls happen in server actions or route handlers — never client-side** (CORS-blocked + leaks credentials)
- Cache wilaya/commune/stopdesk data in Supabase `yalidine_cache` table, refresh daily via cron
- Webhook endpoint at `/api/webhooks/yalidine` receives status updates → updates `orders.yalidine_status` and `orders.status`
- Rate limit aware: respect API quota headers, queue retries with exponential backoff
- All API errors logged to Sentry with order ID context

---

## 10. Quality Bar — NON-NEGOTIABLE

The user explicitly asked for **"high quality result, no errors, all handled."** This means:

### TypeScript
- `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitAny: true`
- Zero `any` types. If you need an escape hatch, use `unknown` and narrow it
- All Supabase types generated via `supabase gen types typescript` — keep in sync

### Validation
- **Every** form validated with Zod on client AND server (server is the source of truth)
- **Every** API response from external services (Yalidine, Liquipedia) validated with Zod before use
- **Every** server action input validated with Zod
- Phone number validation: Algerian format (`/^0[567]\d{8}$/`)

### Error handling
- Every server action wrapped in try/catch, returns `{ success: true, data } | { success: false, error: string }`
- Every async UI state has loading + error + empty handlers (no infinite spinners, no blank screens)
- Error boundary at every Next.js route segment (`error.tsx`)
- 404 page (`not-found.tsx`) styled to match brand (themed, not default Next.js)
- Sentry captures every uncaught error with user context

### UI states checklist (every async component must handle all of these)
- [ ] Loading (skeleton or spinner, never blank)
- [ ] Empty (helpful copy + CTA, never just "No data")
- [ ] Error (retry button, friendly message, never raw error text to user)
- [ ] Success / data
- [ ] Optimistic state (where applicable)

### Performance
- Lighthouse score: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95
- All images via `next/image` with proper `sizes` and `priority` for above-the-fold
- Fonts via `next/font` with `display: swap`
- Code-split admin dashboard (separate bundle from public site)
- No client-side fetching when data can be server-rendered

### Accessibility
- All interactive elements keyboard-accessible
- ARIA labels on icon-only buttons
- Color contrast WCAG AA minimum (the design palette already passes — verify)
- Skip-to-content link
- `prefers-reduced-motion` respected (disable ember animation, disable cursor trail, simplify transitions)

### Security
- All admin routes server-side guarded (don't trust the client)
- Supabase RLS as the final security layer
- CSP headers configured
- All env secrets server-only (no `NEXT_PUBLIC_` prefix for sensitive values)
- Rate limiting on signup/giveaway entry endpoints (use Vercel rate limiting or Upstash)
- CSRF protection on all state-changing actions (Next.js server actions handle this by default)

### Testing
- **Vitest** + **React Testing Library** for unit/component tests
- **Playwright** for critical end-to-end flows:
  - Public: browse store → add to cart → checkout → place order
  - Public: sign up for an event
  - Public: enter a giveaway
  - Admin: log in → create event → create product → process order
- Test utilities for Supabase (use a separate test project, reset between tests)

---

## 11. File Structure

```
silent-hell/
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── (public)/
│   │   │   │   ├── page.tsx                # Home
│   │   │   │   ├── roster/
│   │   │   │   ├── store/
│   │   │   │   ├── events/
│   │   │   │   ├── giveaways/
│   │   │   │   └── account/
│   │   │   ├── (admin)/admin/
│   │   │   │   ├── layout.tsx              # auth guard
│   │   │   │   ├── page.tsx                # dashboard
│   │   │   │   ├── roster/
│   │   │   │   ├── trophies/
│   │   │   │   ├── events/
│   │   │   │   ├── store/
│   │   │   │   ├── giveaways/
│   │   │   │   ├── pages/
│   │   │   │   └── site-config/
│   │   │   ├── (auth)/login/
│   │   │   ├── layout.tsx                  # locale + dir
│   │   │   ├── error.tsx
│   │   │   └── not-found.tsx
│   │   └── api/webhooks/yalidine/route.ts
│   ├── components/
│   │   ├── brand/                          # Hero, Logo, EmberField, CustomCursor, SkullIcon
│   │   ├── public/                         # public site sections
│   │   ├── admin/                          # admin dashboard components
│   │   └── ui/                             # shadcn primitives
│   ├── lib/
│   │   ├── supabase/                       # client, server, admin clients
│   │   ├── i18n/                           # next-intl config
│   │   └── utils/
│   ├── services/
│   │   ├── yalidine/                       # service interface + implementations
│   │   ├── liquipedia/                     # seeder helpers
│   │   └── email/                          # Resend wrapper
│   ├── types/
│   │   ├── database.ts                     # Generated Supabase types
│   │   └── domain.ts                       # Business types
│   ├── messages/
│   │   ├── en.json
│   │   └── ar.json
│   └── styles/
│       └── globals.css                     # ported from design bundle
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── scripts/
│   ├── seed-from-liquipedia.ts
│   └── refresh-yalidine-cache.ts
├── tests/
│   ├── e2e/
│   └── unit/
├── public/
│   └── logo.png
├── silenthell-design/                      # the handoff bundle, KEEP for reference
├── .env.example
└── README.md
```

---

## 12. Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Yalidine (optional — falls back to mock if missing)
YALIDINE_API_ID=
YALIDINE_API_TOKEN=
YALIDINE_FROM_WILAYA_CODE=16  # default sender wilaya (Alger), admin-configurable

# Email
RESEND_API_KEY=

# Error tracking
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# Admin bootstrap
ADMIN_BOOTSTRAP_EMAIL=  # first admin account, only checked on signup

# Site
NEXT_PUBLIC_SITE_URL=https://silenthellesports.com
```

Provide a `.env.example` with all keys and inline comments. The README must explain how to obtain each one.

---

## 13. Build Phases

Deliver in **phases** so the team can validate progress. Don't try to ship everything in one PR.

### Phase 1 — Foundation (DB + design system)
- Next.js 15 + TS + Tailwind v4 setup
- Supabase project init, all migrations applied, RLS policies in place
- Generated TS types from Supabase
- Design tokens, fonts, base components (`SkullIcon`, `CustomCursor`, `EmberField`, `CountUp`, `SectionHeading`) ported from bundle
- i18n routing with `/en` and `/ar`
- Liquipedia seeder script working

### Phase 2 — Public site read-only
- Home with all sections rendering live data from DB
- Roster page + player detail
- Events list + detail (no signup yet)
- Store list + detail (no cart yet)
- Giveaway list + detail (no entry yet)
- Pages (about, terms)

### Phase 3 — Public site interactive
- Auth (signup, login, password reset)
- Cart + COD checkout with **mock Yalidine**
- Event signup with capacity enforcement
- Giveaway entry tracking
- Customer account dashboard
- Email confirmations

### Phase 4 — Admin dashboard
- Admin auth + role check
- All CRUD interfaces for roster, trophies, events, products, giveaways, pages, site config
- Order management with mock Yalidine "create shipment"
- Event signup management with CSV export
- Giveaway entry management with winner draw
- Audit log

### Phase 5 — Real Yalidine + production
- Swap mock Yalidine for real implementation (only requires env vars to flip)
- Yalidine webhook handler
- Daily cache refresh cron
- Production deploy to Vercel
- Custom domain + SSL
- Sentry + analytics live
- Lighthouse + accessibility audit
- E2E tests passing in CI

After each phase, surface a brief written summary (what was built, what to test, what's next) before starting the next phase.

---

## 14. Hosting & Deployment

### Vercel
- Connect the GitHub repo
- Set all env vars in the Vercel dashboard
- Enable Vercel Analytics
- Add custom domain when chosen — Vercel handles SSL automatically
- Production branch: `main`. Preview deploys for every PR.

### Supabase
- Create project in the closest available region (Frankfurt is good for Algeria)
- Apply migrations via Supabase CLI: `supabase db push`
- Enable storage buckets: `players` (public), `products` (public), `giveaways` (public), `pages` (public)
- Set storage policies to match RLS

### Domain
- Buy from Cloudflare Registrar (at-cost) or Namecheap when chosen
- Point to Vercel via the registrar's nameservers OR add A/CNAME records as Vercel instructs

### Cost estimate at launch
- Domain: ~$12/yr
- Vercel: $0 (free hobby tier covers this scale easily)
- Supabase: $0 (free tier)
- Resend: $0 (free tier covers 3k emails/mo)
- Sentry: $0 (free tier)
- **Total: ~$12/yr** until traffic forces upgrades

---

## 15. Final Notes

- **Read the design bundle's README first.** It says "read everything top to bottom before implementing." Do that.
- **When the prototype's structure conflicts with idiomatic Next.js**, prefer Next.js. Match the *visual output* and *interactions*, not the JSX shape.
- **If anything in this spec is ambiguous, ask before guessing.** It's much cheaper to clarify scope than rebuild.
- **The user is in Montreal but the customers are in Algeria.** Test with Algerian phone formats, addresses, and Arabic content. Use realistic seeded data, not Lorem Ipsum.
- **No payment gateway code.** COD only. If you find yourself writing Stripe/PayPal anything, stop.
- **Mobile-first, every screen.** Test at 375px before desktop on every component.
- **The brand is loud, sharp, confident.** Don't soften the design. No rounded-3xl, no pastels, no "friendly" copy. Read the design bundle's tone.

Build it like it's going to be in front of a real audience the day after handoff. Because it is.

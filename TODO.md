# Ray Le Secret — Website Build Plan

A simple, elegant e-commerce site for natural, herbal hair care. White, purple and a touch of gold.
Stack: TanStack Start (React) + Neon Postgres. Payments: manual M-PESA (Paybill / Till / Pochi) first, Paystack later.

---

## 0. Open questions (need your answer before or during the build)

- [x] **Brand spelling:** "Ray Le Secret".
- [x] **Products for now:** Anagen Tonic (120 ml) and Anagen Oil (100 ml).
- [x] **Prices:** Anagen Tonic KES 300; Anagen Oil 100 ml KES 500, 50 ml KES 450, 30 ml KES 300. No bundle price yet.
- [ ] **Payment details:** Pochi la Biashara 0798 175 265 is set. Still needed: the registered name customers see on their phone (the site shows "RAY LE SECRET" for now).
- [ ] **Pickup place(s):** Chokaa for now, open 8 am to 7 pm. Still needed: the exact spot, and whether you also deliver and at what fee.
- [ ] **Contact:** calls and WhatsApp on 0798 175 265. Still needed: email and Instagram / TikTok / Facebook handles (dummy for now).
- [x] **Real product photos.** Bottle photos are the main picture of each product; the label artwork follows as secondary images.
- [ ] **Domain name** and where to host (section 3 has a recommendation).

---

## 1. Design direction (from research)

### 1.1 The idea in one line
A calm white page where the product and real results do the talking, purple carries the brand, and gold appears only as a thin, rare accent.

### 1.2 What the research says, and what we do about it

| Finding | What we build |
|---|---|
| Reviews and brand credibility are the first things shoppers check on a product page. | Real customer reviews and before/after photos near the top of each product page, not at the bottom. |
| Trust signals fail when they sit below the fold on mobile. | A short trust line directly under the Add to Cart button: "100% natural · Handmade in Kenya · Pay with M-PESA · Pickup available". |
| Shoppers trust real, unpolished photos more than glossy or AI-looking images. | Real photos of the bottles in hand and real customer results. Label artwork is used as a secondary image only. |
| Beauty shoppers want ingredient and usage clarity. | Every product page has Benefits, How to use, Ingredients and Caution, taken from the labels. |
| Luxury pages often look good but lack the information needed to buy. | Elegance through spacing and type, with price, size, pickup and payment info always visible. |
| Guest checkout should be the default; most checkouts need about 8 fields but average over 11. | No accounts. Checkout asks for name, phone, pickup or delivery, and the M-PESA code. That's it. |
| On mobile, labels go above fields and keyboards should match the field. | Labels above inputs, numeric keypad for phone, form values kept on error. |
| In Kenya the simplest route is to show the Till/Paybill and confirm by hand; the Paybill account number should carry the order ID. | Order number is created before payment and shown as the Paybill account number. Customer pastes the M-PESA confirmation code. You confirm in the admin page. |
| Gold text on white fails accessibility contrast. | Gold is used for lines, icons and the logo only. Never for body text on white. |

### 1.3 Colour

About 70% white, 20% purple, under 10% gold. No gradients. Flat colour, thin lines, lots of space.

| Token | Hex | Use | Contrast |
|---|---|---|---|
| `white` | `#FFFFFF` | Page background | |
| `lilac-50` | `#F4EFFA` | Soft section background, cards | |
| `purple-900` | `#3B1A6E` | Headings, primary buttons, footer | 13.5:1 on white |
| `purple-600` | `#5B2D9A` | Links, hover states | 9.2:1 on white |
| `ink` | `#1F1630` | Body text | 17.3:1 on white |
| `muted` | `#5F5670` | Secondary text | 6.9:1 on white |
| `gold` | `#C9A24A` | Hairlines, icons, dividers, logo | 2.4:1 on white, so decoration only |
| `gold-light` | `#E3C878` | Gold text on purple (footer, banners) | 8.2:1 on purple-900 |
| `gold-deep` | `#7D5F17` | Small gold-toned labels | 6.0:1 on white, 5.3:1 on lilac |

The purple and gold are matched to the label artwork. Final values get tuned against the logo once it is on the page.

### 1.4 Typography
- **Headings:** Cormorant Garamond (serif). It echoes the serif on the labels and the RL logo.
- **Body and UI:** Jost (clean sans). Readable at small sizes on phones.
- Self-host both (no Google Fonts request), two weights each, `font-display: swap`.
- Small uppercase labels with wide letter spacing for section tags ("NOURISH · STRENGTHEN · REVITALIZE"), as on the label.

### 1.5 Layout and components
- Mobile first. Most Kenyan shoppers will arrive from WhatsApp or Instagram on a phone.
- Max content width about 1200px. Generous vertical spacing.
- Buttons: solid purple with white text, slightly rounded (not pill). Secondary buttons are outlined purple.
- Product cards: white, thin lilac border, image on lilac-50 background, name in serif, price, one button.
- The arch shape from the labels can be reused as an image frame on the home page. Use it once or twice, not everywhere.
- Motion: gentle fade-in only. No carousels, no parallax.
- Sticky "Add to cart" bar on mobile product pages.
- Floating WhatsApp button on every page. This is how your current customers already buy.

### 1.6 Pages

1. **Home**
   - Header: RL logo, Shop, Our Story, Contact, cart icon.
   - Hero: one strong photo, one headline ("Healthy scalp. Beautiful hair."), one button (Shop now).
   - Trust strip: 100% natural · No chemicals · Handmade · For men and women.
   - Products (all three; no need for a separate listing page until there are more).
   - Real results: before/after photos and customer quotes.
   - Our story: short, with a photo of you. A face builds more trust than any badge.
   - How ordering works: Choose → Pay with M-PESA → Pick up or get it delivered.
   - Footer: contact, pickup location, social links, policies.
2. **Shop** (`/shop`): grid of products. Built now so categories can be added later (skin, body, and so on).
3. **Product** (`/products/$slug`): gallery, name, size, price, quantity, Add to cart, trust line, then Benefits, How to use, Ingredients, Caution, reviews, "Pairs well with".
4. **Cart** (slide-over drawer plus `/cart`).
5. **Checkout** (`/checkout`): one page, three short blocks: Your details → Pickup or delivery → Pay with M-PESA.
6. **Order confirmation** (`/orders/$orderNumber`): order summary, payment status, pickup details, "Send on WhatsApp" button.
7. **Our Story**, **Contact**, **FAQ**, **Delivery and returns policy**, **Privacy policy**.
8. **Admin** (`/admin`, password protected): orders list, confirm payment, mark ready / collected, edit products and stock.

### 1.7 Copy and claims
- Use the wording already on the labels. Say "helps", "supports", "promotes". Avoid "cures" or guaranteed regrowth.
- Before/after photos need the customer's permission and a small "results vary" note.
- Show the cautions from the labels (external use only; Anagen Oil not for children under 4).
- "No chemicals" is better written as "No harsh chemicals" or "100% natural herbal ingredients".

---

## 2. Content to gather (you)

- [ ] Photos of each real bottle on a plain white or light background, in daylight. Front, back, in hand, and the product texture. A phone camera is fine.
- [ ] 3 to 6 customer before/after photos with permission.
- [ ] 5 to 10 short customer reviews (WhatsApp screenshots are fine, with names or initials).
- [ ] A photo of you and 3 to 5 sentences on why you started making these products.
- [ ] A clean copy of the logo, ideally the original design file. (For now the grey background is removed automatically by `pnpm images`.)
- [ ] Full ingredient list per product, if you are willing to share it.

---

## 3. Technical decisions

| Area | Choice | Why |
|---|---|---|
| Framework | TanStack Start (React 19, Vite) with TanStack Router | Your chosen stack. Server-rendered pages are fast and good for Google. |
| Data fetching | Route loaders + `createServerFn`, TanStack Query for cart/checkout mutations | Standard Start pattern. |
| Database | Neon Postgres | Your choice. |
| ORM | Drizzle ORM + drizzle-kit migrations | Light, typed, works with Neon's serverless driver. |
| DB driver | `@neondatabase/serverless` over HTTP (`drizzle-orm/neon-http`) | Works on Cloudflare: each query is one web request, with no connections to manage. Order creation uses an atomic batch plus a `stock >= 0` rule in the database; cancelling uses a single statement. |
| Styling | Tailwind CSS v4 with the colour tokens above as theme variables | Small CSS, consistent design. |
| UI primitives | shadcn/ui, only what is needed (button, input, sheet, dialog, accordion) | Accessible, restyled to the brand. |
| Validation | Zod, shared between forms and server functions | One source of truth. |
| Forms | TanStack Form | Fits the stack. |
| Cart | Client state saved in `localStorage` (Zustand or TanStack Store) | No accounts needed. Prices are always re-read from the database at checkout. |
| Images | Pre-sized WebP/AVIF in the repo to start; move to Cloudinary or R2 when admin uploads are needed | Three products don't need an image service yet. |
| Admin auth | Single admin login: scrypt password hash in `.env`, signed HTTP-only session cookie lasting 7 days, 5 sign-in attempts per 15 minutes (Better Auth if more users are needed later) | Simplest thing that is still safe. |
| Hosting | Cloudflare Pages (Nitro `cloudflare_pages` preset) | Your choice. Note: Nitro and Cloudflare now recommend Workers for new projects; switching later is a one-line preset change. |
| Notifications | WhatsApp deep link for order messages now; email (Resend) or SMS (Africa's Talking) later | No cost to start. |

### Data model (first version)

- `products`: id, slug, name, tagline, description, benefits (json), how_to_use (json), ingredients, caution (json), size_label, price_kes (integer), stock, is_active, sort_order, timestamps
- `product_images`: id, product_id, url, alt, sort_order
- `categories` and `product_categories`: ready for when more product types arrive
- `pickup_locations`: id, name, address, hours, map_url, is_active
- `orders`: id, order_number (short, human readable, e.g. `RL48271`), access_token (random, used in the order link), customer_name, phone, email (optional), fulfilment (`pickup` | `delivery`), pickup_location_id, delivery_address, delivery_fee_kes, subtotal_kes, total_kes, payment_method (`paybill` | `till` | `pochi`), mpesa_code, status (`awaiting_payment` | `payment_submitted` | `paid` | `ready` | `completed` | `cancelled`), notes, timestamps
- `order_items`: id, order_id, product_id, name_snapshot, price_kes_snapshot, quantity
- `reviews`: id, product_id, author_name, rating, body, photo_url, is_published
- `settings`: paybill number, account format, till number, pochi number, WhatsApp number, delivery fees

Money is stored as whole KES integers.

### Manual M-PESA flow

1. Customer fills details and chooses pickup or delivery.
2. Server creates the order (`awaiting_payment`) with prices and stock read from the database, and returns the order number.
3. Page shows clear steps: "Go to M-PESA → Lipa na M-PESA → Paybill → Business no. `XXXXXX` → Account no. `RL48271` → Amount `KES 1,500`", with tap-to-copy on each value. Till and Pochi get their own version of the steps.
4. Customer pastes the M-PESA confirmation code (format checked, must be unique) and submits. Status becomes `payment_submitted`.
5. Confirmation page with a "Send order on WhatsApp" button that opens a pre-filled message to you.
6. You check the code against your M-PESA messages in `/admin` and click Confirm. Status becomes `paid`, then `ready`, then `completed`.
7. The customer can reopen their order link at any time to see the status.

Paystack later: add an `stk_push` payment method and a webhook that sets `paid` automatically. The order model above does not need to change.

---

## 4. Build steps

### Phase 1: Project setup
- [x] `git init`, add `.gitignore`, move the images into `assets/brand/` with clean file names (one file is missing its `.` before `jpeg`, and one is a duplicate).
- [x] Scaffold TanStack Start with TypeScript and pnpm.
- [x] Add Tailwind v4, define the colour and font tokens from section 1.
- [x] Self-host Cormorant Garamond and Jost.
- [ ] Add shadcn/ui and restyle button, input, sheet, dialog, accordion. (Installed and mapped to the brand colours; sheet and dialog get added with the cart.)
- [x] Set up ESLint, Prettier, and `.env` handling for `DATABASE_URL`. (`SESSION_SECRET` and `ADMIN_PASSWORD_HASH` come with the admin phase.)
- [x] Prepare the logo: transparent background, 2x sizes, favicon. (Social share image is in Phase 9.)

### Phase 2: Database
- [ ] Create the Neon project and a dev branch, put its connection string in `.env.local`, run `pnpm db:migrate` and `pnpm db:seed`. (Needs your Neon account. Until then the site shows the built-in catalogue.)
- [x] Add Drizzle, write the schema from section 3, run the first migration.
- [x] Seed script with the products (text taken from the labels), a pickup location and settings.

### Phase 3: Layout and home page
- [x] Root layout: header with logo, mobile menu, footer, floating WhatsApp button. (Cart count comes with Phase 5.)
- [x] Home page sections in the order listed in 1.6.
- [x] Checked at 390px and 1440px widths. (768px tablet width not yet checked.)

### Phase 4: Catalogue
- [ ] `/shop` grid loaded from the database.
- [x] `/products/$slug` page with gallery, details accordion and a sticky mobile order bar. The button is "Order on WhatsApp" until the cart exists. (Reviews come with Phase 8.)
- [x] Out-of-stock state.
- [x] 404 page in brand style.

### Phase 5: Cart
- [x] Cart store saved to `localStorage`.
- [x] Cart drawer and `/cart` page with quantity controls and subtotal.
- [x] Server function that re-validates cart items (price, stock, active) before checkout.

### Phase 6: Checkout and orders
- [x] Checkout form with Zod validation: name, phone (Kenyan format, phone keypad), pickup point, payment method, optional note.
- [x] Pickup location picker with address and hours.
- [ ] Delivery option with address and fee. (Not built: checkout is pickup only and points to WhatsApp for delivery. Needs your delivery areas and fees.)
- [x] `createOrder` server function: transaction, price snapshot, stock check, order number.
- [x] M-PESA instructions block with tap-to-copy for Paybill, Till and Pochi.
- [x] M-PESA code submission with format and uniqueness checks.
- [x] Order confirmation and status page at `/orders/$token`. The link uses a long random token, not the order number, so other people's orders can't be guessed.
- [x] WhatsApp pre-filled order message.
- [x] Basic rate limiting on order creation and code submission (in memory, per IP; replace with a shared store if hosted serverless).

### Phase 7: Admin
- [x] Login page and session cookie; `/admin` routes and every admin server function are protected. Set the password with `pnpm admin:password`.
- [x] Orders list with filter by status, search by order number, name, phone or M-PESA code.
- [x] Order detail: confirm payment, mark ready, mark collected, cancel (restores stock), message the customer on WhatsApp.
- [ ] Release unpaid orders automatically after a set time. (For now, cancel them by hand in the admin: filter by "Awaiting payment".)
- [x] Products: edit text, price, stock, show/hide. Add new products (they show the logo until photo upload exists, see Later).
- [x] Settings: M-PESA numbers, WhatsApp number, pickup points. The shop footer and WhatsApp buttons read from these.
- [ ] Settings still in code (`src/lib/site.ts`): email and social links. Delivery fees wait for the delivery option.

### Phase 8: Content pages and trust
- [ ] Our Story, Contact, FAQ, Delivery and returns, Privacy policy.
- [ ] Reviews and before/after section fed from the `reviews` table.
- [ ] Trust line under every Add to Cart button.

### Phase 9: Speed, SEO, accessibility
- [x] Images: WebP in two sizes each, lazy loading below the fold, fixed dimensions (layout shift 0.004). Cached for a week; scripts, styles and fonts are pre-compressed and cached for a year.
- [x] Page titles, descriptions, canonical links and Open Graph preview images (1200 × 630) for the home page and each product.
- [ ] Set `SITE_URL` on the live host so previews and the sitemap use the real address.
- [x] Product and Organization structured data (JSON-LD), `/sitemap.xml`, `/robots.txt` (admin, cart, checkout and order pages are kept out of search).
- [x] Keyboard navigation, focus styles, alt text, contrast. axe-core finds 0 issues on home, product, cart, checkout (with errors), order page, 404 and admin sign-in. `gold-deep` was darkened to pass on lilac.
- [x] Lighthouse on mobile (local production build): home 91 / product 92 performance, 100 accessibility, 100 best practices, 100 SEO. Re-measure on the live host.

### Phase 10: Launch
- [x] Build for Cloudflare Pages and test it locally in Cloudflare's runtime (order, payment code, admin steps, cancel).
- [ ] `wrangler login`, create the Pages project, set the four secrets, `pnpm deploy`. (Steps in README.)
- [ ] After the first deploy, check admin sign-in works on the free plan (10 ms CPU limit). If it fails with Error 1102, move to Workers Paid.
- [ ] Connect the domain and HTTPS.
- [ ] Place a real test order end to end with each payment method.
- [ ] Add privacy-friendly analytics (Plausible or Umami).
- [ ] Set up Google Business Profile and link the site from Instagram, TikTok and WhatsApp Business.

### Later
- [ ] Paystack (M-PESA STK push and cards) with webhook confirmation.
- [ ] SMS or email order updates.
- [ ] Product categories, search and filters when the range grows.
- [ ] Bundles and discount codes.
- [ ] Customer accounts and reorder.
- [ ] Customers submit their own reviews.
- [ ] Admin image uploads (Cloudinary or R2).

---

## 5. Sources

- [Shopify: best beauty ecommerce sites](https://www.shopify.com/ca/enterprise/blog/best-beauty-ecommerce-sites)
- [Cosmetics Business: 7 beauty PDP elements that lift conversion in 2026](https://cosmeticsbusiness.com/7-beauty-pdp-elements-that-lift-conversion-in)
- [Clutch: product page design elements](https://clutch.co/resources/product-page-design-elements)
- [Shoplift: why skincare shoppers don't convert until they trust you](https://www.shoplift.ai/post/why-skincare-shoppers-dont-convert-until-they-trust-you)
- [Foursixty: ecommerce trust signals](https://foursixty.com/blog/ecommerce-trust-signals/)
- [Fibre2Fashion: the premium e-commerce gap](https://www.fibre2fashion.com/industry-article/11501/the-premium-fashion-e-commerce-gap-why-desire-trust-and-conversion-must-work-together)
- [Baymard: current state of checkout UX](https://baymard.com/blog/current-state-of-checkout-ux)
- [Baymard: checkout flow UX guide](https://baymard.com/learn/checkout-flow-ux-optimization)
- [Baymard: mobile checkout forms](https://baymard.com/blog/mobile-ecommerce-checkout-forms)
- [Paystack Kenya: M-PESA channels](https://paystack.com/docs/v2/ke/payments/channels/mpesa)
- [Safaricom: paying businesses and online](https://safaricom.co.ke/main-mpesa/m-pesa-services/lipa-na-m-pesa/pay-online)
- [PaybillKE: M-PESA for online businesses 2026](https://paybillke.com/guides/mpesa-for-online-businesses-2026)
- [Neon: TanStack Start guide](https://neon.com/docs/guides/tanstack-start)
- [TanStack Start: databases](https://tanstack.com/start/latest/docs/framework/react/guide/databases)
- [Webflow: luxury brand websites](https://webflow.com/blog/luxury-brand-websites)
- [Hook Agency: luxury website colors](https://hookagency.com/blog/luxury-website-colors/)
- [OWDT: luxury color palette](https://owdt.com/insight/luxury-color-palette/)

Most of the design sources are vendor or agency articles, so their numbers are directional. The Baymard checkout findings are the most rigorous. Contrast ratios in 1.3 were calculated directly.

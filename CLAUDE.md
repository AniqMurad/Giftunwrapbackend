# Giftunwrapbackend — API (CLAUDE.md)

Express 5 + Mongoose 8 REST API. Package name: `giftunwrap-backend`, ES modules (`"type": "module"`), entry point `index.js`. Run with `npm run dev` (nodemon) or `npm start`.

## Route structure
`index.js` mounts ten resource routers under `/api/*`, all in `routes/`, one file per resource, all following the same shape (`express.Router()`, import controller fns, `router.method(path, controllerFn)`, default export):

| Mount | Router file | Controller file |
|---|---|---|
| `/api/auth` | `authRoutes.js` | `authController.js` |
| `/api/products` | `productRoutes.js` | `productController.js` |
| `/api/messages` | `messagesRoutes.js` | `messageController.js` |
| `/api/users` | `userRoutes.js` | `userController.js` |
| `/api/orders` | `orderRoutes.js` | `orderController.js` |
| `/api/gift-box-items` | `giftBoxItemRoutes.js` | `giftBoxItemController.js` |
| `/api/boxes` | `boxRoutes.js` | `boxController.js` |
| `/api/cards` | `cardRoutes.js` | `cardController.js` |
| `/api/quotes` | `quoteRoutes.js` | `quoteController.js` |
| `/api/blogs` | `blogRoutes.js` | `blogController.js` |

Routes that accept images use the shared `upload` middleware (`upload.array('images', 4)` or `upload.any()`) for `multipart/form-data`; everything else is JSON.

## Controller conventions
- Named exports, `async (req, res) => { try {...} catch (error) {...} }` — no service layer, no `.then()` chains.
- Success: `res.status(200/201).json(data)` or `res.status(200).json({ message, item })`.
- Failure: `res.status(4xx/5xx).json({ message: '...', error })` — `error` is sometimes the raw error object, sometimes `error.message`; stay consistent with whichever the controller you're editing already uses.
- `GiftBoxItem`/`Box`/`Card` controllers key lookups off the numeric `id` field via `parseInt(req.params.id)`, **not** Mongo's `_id` — check the model before assuming `_id`.

## Mongoose model patterns
One schema per file in `models/`. Common conventions across them:
- Manual `updatedAt` maintenance via a `pre('save')` hook (`this.updatedAt = Date.now(); next();`) rather than `{ timestamps: true }`.
- `category`/`status` fields use `enum` (e.g. `GiftBoxItem.category`: `chocolates-snacks`, `flowers`, `customised-items`, `jewellery-accessories`, `fragrances`, `clothing`, `shoes`, `beauty-personal-care`; `Quote.status`: `pending`, `contacted`, `quoted`, `closed`).
- Embedded sub-documents for nested data: `Order` (`shippingAddressSchema`, `orderItemSchema`, `paymentDetailsSchema`), `Product` (nested review schema), `GiftBoxItem.colorVariants` (`{ color, image }`).
- `Counter.js` (`{ name, value }`) + `utils/getNextProductId.js` back sequential numeric IDs via `findOneAndUpdate` + `$inc` + `upsert: true`.
- `User.js` is intentionally minimal (`email`, `password`, `name`, `phoneNumber`) — password hashing happens in `authController.js` (`bcryptjs.hash(password, 10)`), not in a model hook.

## Cloudinary integration
- `utils/cloudinary.js` configures the `cloudinary` v2 SDK. **It currently hardcodes `cloud_name`/`api_key`/`api_secret` instead of reading them from `.env`** — if you touch this file, migrate those to `process.env.*` rather than adding more hardcoded values.
- `middleware/upload.js` wires `multer` + `multer-storage-cloudinary` (`CloudinaryStorage`) to that config, fixed to `folder: 'products'`, `allowed_formats: ['jpg','jpeg','png','webp']`.
- Routes that need an upload import this `upload` middleware directly (e.g. `productRoutes.js`: `upload.array('images', 4)`); the resulting secure URL shows up on `req.file.path` / `req.files[].path` and controllers write it straight into the model's `image`/`colorVariants[].image` field. There is no separate `cloudinary.uploader.upload()` call anywhere — `multer-storage-cloudinary` does it implicitly.
- No "delete from Cloudinary" calls exist — deleting a document does not delete its Cloudinary asset.

## Middleware
Only two middleware files exist:
- `middleware/checkDbConnection.js` — returns `503` if `mongoose.connection.readyState !== 1`.
- `middleware/upload.js` — the Cloudinary/multer upload pipeline above.

## Email service
- `services/emailService.js` owns the single Nodemailer `transporter` (built from `MAIL_HOST`/`MAIL_PORT`/`MAIL_SECURE`/`MAIL_USER`/`MAIL_PASS`) and exports `sendCustomerOrderEmail(order)` / `sendAdminOrderNotification(order)`. Both catch their own errors internally and log `✓`/`✗` rather than throwing, so a Gmail outage never fails order creation.
- `services/emailTemplates.js` builds the HTML (inline CSS, table-based layout, `escapeHtml` on all interpolated user data) — controllers never touch email HTML.
- `orderController.js#createOrder` fires both emails after `order.save()` via `Promise.all([...])`, wrapped in its own try/catch as a second safety net.

**There is no auth middleware** (no `verifyToken`/JWT check on any route) and **no global error handler** — every controller handles its own try/catch. Admin-style endpoints (e.g. `DELETE /users/:id`, `DELETE /products/:id`) are reachable without any authentication today.

## Environment config
- `dotenv.config()` is called at the top of `index.js`; everything reads from `process.env` directly (no `config/` folder, no env validation/schema).
- Known keys (see root `CLAUDE.md`): `MONGO_URI`, `PORT`, `JWT_SECRET`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE`, `MAIL_USER`, `MAIL_PASS`, `ADMIN_EMAIL`.
- **No `.gitignore` exists in this repo**, so `.env` is not excluded from version control — don't treat secrets here as private; rotate before reuse.
- `generateSecret.js` is a one-off CLI script (`node generateSecret.js`) that prints a random 64-byte hex string for use as `JWT_SECRET`. It is **not imported anywhere** — it's a manual tool, not part of the running app, and uses CommonJS `require` even though the rest of the project is ESM — run it standalone, don't import it.
- Mongo connection (`index.js`) sets `serverSelectionTimeoutMS: 10000`, `socketTimeoutMS: 45000`, `maxPoolSize: 10`, `minPoolSize: 1`, `family: 4`, and skips reconnecting if `mongoose.connection.readyState === 1`.
- CORS is wide open: `cors({ origin: '*', methods: [...], allowedHeaders: ['Content-Type','Authorization'] })`.

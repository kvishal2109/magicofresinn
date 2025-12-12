# Environment Variables Setup

Copy these variables to your `.env.local` file and Vercel dashboard:

## Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

## Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

## Existing Variables (keep these)
NEXT_PUBLIC_APP_NAME=magi.cofresin
NEXT_PUBLIC_UPI_ID=shrutikumari21370@okaxis
ADMIN_PHONE=your-admin-phone
ADMIN_PASSWORD=admin123
RESEND_API_KEY=your-resend-key
OWNER_EMAIL=your-email
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-phone

## How to get Supabase credentials:
1. Go to your Supabase project dashboard
2. Click Settings → API
3. Copy:
   - Project URL → NEXT_PUBLIC_SUPABASE_URL
   - anon/public key → NEXT_PUBLIC_SUPABASE_ANON_KEY
   - service_role key → SUPABASE_SERVICE_ROLE_KEY (keep secret!)

## How to get Cloudinary credentials:
1. Go to https://cloudinary.com/console
2. Dashboard shows:
   - Cloud name → CLOUDINARY_CLOUD_NAME
   - API Key → CLOUDINARY_API_KEY
   - API Secret → CLOUDINARY_API_SECRET


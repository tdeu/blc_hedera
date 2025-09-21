// Supabase Storage Setup Script
// Run this script to set up the storage bucket and policies for market images

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service role key needed for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration:');
  console.error('- VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  console.error('\nPlease add SUPABASE_SERVICE_ROLE_KEY to your .env file');
  console.error('You can find this key in your Supabase dashboard under Settings > API');
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorage() {
  try {
    console.log('🚀 Setting up Supabase storage for market images...\n');

    // 1. Create bucket
    console.log('1. Creating storage bucket...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      throw new Error(`Failed to list buckets: ${listError.message}`);
    }

    const bucketExists = buckets?.some(bucket => bucket.name === 'market-assets');

    if (bucketExists) {
      console.log('   ✅ Bucket "market-assets" already exists');
    } else {
      const { error: createError } = await supabase.storage.createBucket('market-assets', {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      });

      if (createError) {
        throw new Error(`Failed to create bucket: ${createError.message}`);
      }
      console.log('   ✅ Created bucket "market-assets"');
    }

    // 2. Set up storage policies
    console.log('\n2. Setting up storage policies...');

    // Policy for public uploads
    const uploadPolicy = `
      CREATE POLICY IF NOT EXISTS "Allow public uploads" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'market-assets');
    `;

    // Policy for public reads
    const readPolicy = `
      CREATE POLICY IF NOT EXISTS "Allow public reads" ON storage.objects
      FOR SELECT USING (bucket_id = 'market-assets');
    `;

    // Execute policies
    const { error: uploadPolicyError } = await supabase.rpc('exec_sql', { sql: uploadPolicy });
    if (uploadPolicyError) {
      console.log('   ⚠️  Upload policy might already exist:', uploadPolicyError.message);
    } else {
      console.log('   ✅ Created upload policy');
    }

    const { error: readPolicyError } = await supabase.rpc('exec_sql', { sql: readPolicy });
    if (readPolicyError) {
      console.log('   ⚠️  Read policy might already exist:', readPolicyError.message);
    } else {
      console.log('   ✅ Created read policy');
    }

    // 3. Test upload
    console.log('\n3. Testing storage setup...');

    // Create a small test file
    const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const testPath = `test-${Date.now()}.txt`;

    const { error: uploadError } = await supabase.storage
      .from('market-assets')
      .upload(testPath, testFile);

    if (uploadError) {
      throw new Error(`Upload test failed: ${uploadError.message}`);
    }

    // Clean up test file
    await supabase.storage.from('market-assets').remove([testPath]);
    console.log('   ✅ Storage upload test successful');

    console.log('\n🎉 Supabase storage setup complete!');
    console.log('\nYou can now upload market images in your application.');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\nPlease check your Supabase configuration and try again.');
    process.exit(1);
  }
}

// Run setup
setupStorage();
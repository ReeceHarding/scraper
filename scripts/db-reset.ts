import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  try {
    console.log('Starting database reset...');

    // Save Gmail tokens if they exist
    const { data: tokens } = await supabaseAdmin
      .from('gmail_tokens')
      .select('*');
    
    if (tokens) {
      process.env.SAVED_GMAIL_TOKENS = JSON.stringify(tokens);
    }

    // Read and execute migration files
    const migrationPath = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationPath)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      console.log(`Applying migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationPath, file), 'utf8');
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql });
      if (error) throw error;
    }

    // Restore Gmail tokens if they were saved
    if (process.env.SAVED_GMAIL_TOKENS) {
      const savedTokens = JSON.parse(process.env.SAVED_GMAIL_TOKENS);
      for (const token of savedTokens) {
        await supabaseAdmin
          .from('gmail_tokens')
          .insert(token);
      }
    }

    console.log('Database reset completed successfully');
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
}

main(); 
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const apiKey = process.env.API_KEY

if(!url || !apiKey) { 
    throw new Error('Missing environment variables')
}

// Create Supabase client
const supabase = createClient('your_project_url', 'your_supabase_api_key')

// Upload file using standard upload
export async function uploadFile(file) {
  const { data, error } = await supabase.storage.from('bucket_name').upload('file_path', file)
  if (error) {
    // Handle error
  } else {
    // Handle success
  }
}

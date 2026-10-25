
import { supabase } from './lib/supabase.ts'

async function testConnection() {
  console.log('Testing Supabase connection...')

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)

  if (error) {
    console.error('Supabase connection error:', error.message)
    return
  }

  console.log('Supabase connection successful!', data)
}

testConnection()

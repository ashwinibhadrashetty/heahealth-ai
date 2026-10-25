
import { supabase } from './lib/supabase'

async function testConnection() {
  console.log('Testing Supabase connection...')

  const { data, error } = await supabase.auth.getSession()

  if (error) {
    console.error('Supabase error:', error.message)
    return
  }

  console.log('Supabase client initialized successfully.')
  console.log('Current session:', data.session)
}

testConnection()

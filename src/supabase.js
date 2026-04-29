import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://yjsciwyrmcigsjbpyrqy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlqc2Npd3lybWNpZ3NqYnB5cnF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MzExMDIsImV4cCI6MjA5MzAwNzEwMn0.pkDtzhgSc4MXmhyvvN6JTdxPW-kkm759TY-AKO4E66o'
)

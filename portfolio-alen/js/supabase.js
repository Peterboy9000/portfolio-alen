// js/supabase.js
// ================================================
// SUPABASE CLIENT CONFIGURATION
// Replace with your actual Supabase project values
// from: https://app.supabase.com → Settings → API
// ================================================

const SUPABASE_URL = 'https://kjvhnjycerrcesulttou.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqdmhuanljZXJyY2VzdWx0dG91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNjY5MzYsImV4cCI6MjA4Nzc0MjkzNn0.-DWvJeujKLKMBZC1hdwQcOW3HWzWN_DO4IxfuEFInkU';

// Initialize Supabase client
// (supabase-js is loaded via CDN in your HTML)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── PROJECTS ─────────────────────────────────────

async function getProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('featured', true)
    .order('display_order', { ascending: true });

  if (error) { console.error('getProjects:', error); return []; }
  return data;
}

async function trackProjectView(projectId) {
  if (!projectId || projectId === 'REPLACE_WITH_SUPABASE_ID') return;

  // Increment view count
  const { error: viewErr } = await supabase.rpc('increment_project_views', { project_id: projectId });
  if (viewErr) {
    // Fallback if RPC not set up
    const { data } = await supabase.from('projects').select('views').eq('id', projectId).single();
    if (data) {
      await supabase.from('projects').update({ views: (data.views || 0) + 1 }).eq('id', projectId);
    }
  }

  // Log to analytics
  await supabase.from('analytics').insert({
    type: 'project_view',
    project_id: projectId,
    user_agent: navigator.userAgent,
    referrer: document.referrer || null
  });
}

// ─── ANALYTICS ────────────────────────────────────

async function trackPageView(page = '/') {
  await supabase.from('analytics').insert({
    type: 'page_view',
    page,
    user_agent: navigator.userAgent,
    referrer: document.referrer || null
  });
}

// ─── CONTACT FORM ─────────────────────────────────

async function submitContactForm({ name, email, subject, message }) {
  // Save message to Supabase
  const { error } = await supabase.from('messages').insert({
    name, email, subject, message
  });

  if (error) throw new Error(error.message);

  // Log to analytics
  await supabase.from('analytics').insert({
    type: 'contact_submit',
    user_agent: navigator.userAgent
  });

  // Trigger email via Supabase Edge Function (optional)
  // If you've deployed the edge function, uncomment below:
  /*
  await supabase.functions.invoke('send-contact-email', {
    body: { name, email, subject, message }
  });
  */

  return { success: true };
}

// ─── PROFILE ──────────────────────────────────────

async function getProfile() {
  const { data, error } = await supabase
    .from('profile')
    .select('*')
    .single();

  if (error) { console.error('getProfile:', error); return null; }
  return data;
}

export { supabase, getProjects, trackProjectView, trackPageView, submitContactForm, getProfile };

import { supabase, ADMIN_EMAIL } from '../supabase.js';

let currentUser = null;
let authListeners = [];

export function getCurrentUser() {
  return currentUser;
}

export function isAdmin() {
  return currentUser?.email === ADMIN_EMAIL;
}

export function getUsername() {
  if (!currentUser) return null;
  const email = currentUser.email;
  return email.split('@')[0];
}

export function onAuthChange(callback) {
  authListeners.push(callback);
  // Immediately call if already have user
  if (currentUser !== undefined) {
    callback(currentUser);
  }
}

export async function initAuth() {
  // Check initial session
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    if (session.user.email?.endsWith('@kiit.ac.in')) {
      currentUser = session.user;
      await syncUserTracking(session.user);
    } else {
      await supabase.auth.signOut();
      showToast('Only @kiit.ac.in emails are allowed!', 'error');
      currentUser = null;
    }
  }
  notifyListeners();

  // Listen for auth changes
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      if (session.user.email?.endsWith('@kiit.ac.in')) {
        currentUser = session.user;
        await syncUserTracking(session.user);
      } else {
        await supabase.auth.signOut();
        showToast('Only @kiit.ac.in emails are allowed!', 'error');
        currentUser = null;
      }
    } else {
      currentUser = null;
    }
    notifyListeners();
  });
}

async function syncUserTracking(user) {
  if (!user?.email) return;
  
  try {
    const { error } = await supabase
      .from('users_tracking')
      .upsert({ 
        email: user.email, 
        last_login: new Date().toISOString() 
      }, { onConflict: 'email' });
      
    if (error) console.error('Tracking error:', error.message);
  } catch (err) {
    console.error('Tracking catch:', err);
  }
}

export async function signIn() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      queryParams: {
        hd: 'kiit.ac.in',
      },
    },
  });
  if (error) {
    showToast('Login failed: ' + error.message, 'error');
  }
}

export async function signOut() {
  await supabase.auth.signOut();
  currentUser = null;
  notifyListeners();
  showToast('Logged out successfully', 'info');
}

function notifyListeners() {
  authListeners.forEach((cb) => cb(currentUser));
}

export function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
    if (container.children.length === 0) container.remove();
  }, 3000);
}

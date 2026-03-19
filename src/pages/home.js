import { navigateTo } from '../router.js';

export function renderHome(container) {
  container.innerHTML = `
    <div class="home-page">
      <!-- Hero -->
      <section class="hero">
        <span class="hero-badge">🎓 KIIT University </span>
        <h1 class="hero-title">KIIT KHOJ</h1>
        <p class="hero-subtitle">
          Your ultimate treasure trove of <strong style="color: var(--text-accent);">Previous Year Questions</strong>. 
          Midsem & Endsem papers — merged, organized, and ready to conquer. 
          Practice smart, score big. 🚀
        </p>
        <div class="hero-cta">
          <button class="btn btn-primary" id="cta-search">
            🔍 Find Your PYQs
          </button>
          <button class="btn btn-secondary" id="cta-placements">
            💼 Placement Talks
          </button>
        </div>
      </section>

      <!-- Why PYQs Matter -->
      <section class="pyq-section">
        <h2 class="glow-text fade-in">Why PYQs are Your Secret Weapon 🏆</h2>
        <div class="pyq-cards">
          <div class="glass-card pyq-card fade-in fade-in-delay-1">
            <span class="icon">🎯</span>
            <h3>Know the Pattern</h3>
            <p>Understand question patterns, marking schemes, and frequently asked topics. Stop guessing, start knowing.</p>
          </div>
          <div class="glass-card pyq-card fade-in fade-in-delay-2">
            <span class="icon">⚡</span>
            <h3>Speed Up Revision</h3>
            <p>Revise 10x faster by focusing on what actually gets asked. Quality over quantity — always.</p>
          </div>
          <div class="glass-card pyq-card fade-in fade-in-delay-3">
            <span class="icon">🧠</span>
            <h3>Build Confidence</h3>
            <p>Walk into every exam knowing you've practiced the real deal. No surprises, just preparation.</p>
          </div>
        </div>
      </section>

      <div class="divider container"></div>

      <!-- How to Use -->
      <section class="howto-section">
        <h2 class="glow-text fade-in">How It Works ✨</h2>
        <div class="howto-steps">
          <div class="glass-card howto-step fade-in fade-in-delay-1">
            <div class="step-number">1</div>
            <h3>Login with KIIT Mail</h3>
            <p>Sign in with your @kiit.ac.in email. It's secure and instant.</p>
          </div>
          <div class="glass-card howto-step fade-in fade-in-delay-2">
            <div class="step-number">2</div>
            <h3>Search Your Subject</h3>
            <p>Type any subject name — get instant autocomplete with all 50+ subjects.</p>
          </div>
          <div class="glass-card howto-step fade-in fade-in-delay-3">
            <div class="step-number">3</div>
            <h3>Preview & Download</h3>
            <p>View PDFs right in the browser. Download with one click. Simple.</p>
          </div>
          <div class="glass-card howto-step fade-in fade-in-delay-4">
            <div class="step-number">4</div>
            <h3>Discuss & Contribute</h3>
            <p>Ask doubts, answer peers, upload your own PYQs. Build the community.</p>
          </div>
        </div>
      </section>

      <div class="divider container"></div>

      <!-- Stats -->
      <section class="stats-section">
        <div class="stats-grid">
          <div class="glass-card stat-item fade-in fade-in-delay-1">
            <div class="stat-number">50+</div>
            <div class="stat-label">Subjects Covered</div>
          </div>
          <div class="glass-card stat-item fade-in fade-in-delay-2">
            <div class="stat-number">8</div>
            <div class="stat-label">Semesters</div>
          </div>
          <div class="glass-card stat-item fade-in fade-in-delay-3">
            <div class="stat-number">∞</div>
            <div class="stat-label">Community Driven</div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="copyright-footer no-select">
        <p>© 2026 KIIT KHOJ. All rights reserved.</p>
        <p style="margin-top: 4px; font-size: 0.75rem; color: var(--text-muted);">
          Made with ❤️ for KIIT Students
        </p>
      </footer>
    </div>
  `;

  // CTA buttons
  container.querySelector('#cta-search').addEventListener('click', () => navigateTo('/search'));
  container.querySelector('#cta-placements').addEventListener('click', () => navigateTo('/placements'));

  // Intersection observer for fade-in animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = 'running';
      }
    });
  }, { threshold: 0.1 });

  container.querySelectorAll('.fade-in').forEach((el) => {
    el.style.animationPlayState = 'paused';
    observer.observe(el);
  });
}

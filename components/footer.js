export default function footer() {
  const year = new Date().getFullYear();
  return `
  <footer>
    <div class="flex-btwn">
      <span class="site-name">Pain System Hub</span>
      <div class="social-icons">
        <a href="https://github.com/jamainefacey-blip/Jamaine-Facey">GitHub</a>
      </div>
    </div>
    <small>
      <div>Deployed on Vercel &mdash; &copy; ${year} Pain System</div>
    </small>
  </footer>
  `;
}

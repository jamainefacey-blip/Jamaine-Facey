export default function header({ title }) {
  return `
    <header>
      <nav>
        <a href="/">
          <span class="site-name">Pain System Hub</span>
        </a>
        <ul>
           ${title == "Home" ? "" : `<ul><li>${title}</li></ul>`}
          <ul><a href="/">Examples</a></li>
        </ul>
      </nav>
      <section>
        <h1>Pain System Hub</h1>
        <p>Sandbox environment — deployed on Vercel.</p>
      </section>
    </header>
    <hr>
  `;
}

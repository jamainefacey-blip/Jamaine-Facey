import head from "./head.js";
import header from "./header.js";
import footer from "./footer.js";
import deployButton from "./deploy-button.js";

const explainer = `
<hr>
<section>
  <h2>What are Edge Functions?</h2>
  <p>Using JavaScript and TypeScript, <a href="https://vercel.com/docs/functions/edge-functions" target="_blank" rel="noopener">Vercel Edge Functions</a> give you the power to modify network requests to localize content, serve relevant ads, authenticate visitors, A/B test content, and much more!
  <p>
  This all happens at the <strong>Edge</strong> — directly from the worldwide location closest to each user.</p>
  </p>

  <blockquote>
  <p>To use Edge Functions on Vercel, add TypeScript files to your project's <code>/api</code> directory with the edge runtime config.</p>
  <p><a href="https://vercel.com/docs/functions/edge-functions" target="_blank" rel="noopener">Learn more in the Vercel docs</a>.</p>
  </blockquote>
  </section>
  `;

export default function layout(data) {
  return `
<!DOCTYPE html>
<html lang="en">
  ${head({
    title: data.title,
    metaDescription: data.metaDescription,
    url: data.url,
  })}
  <body>
  ${header({ title: data.title })}
  <main>

    ${data.url.pathname !== "/" ? "" : explainer}

    <section>
    ${data.content}
    <p>
    ${
      data.url.pathname !== "/" ? `<a href="/" class="btn-primary">Explore more examples</a>` : ""
    }
    </p>
    </section>

    ${data.url.pathname !== "/" ? explainer : ""}
    <hr/>
    <section>
      <h3>Deploy this site to Vercel</h3>
      <p>
        Try out Edge Functions on Vercel today! Click the button below to deploy this site to your Vercel account.
      </p>
      <p>${deployButton()}</p>
    </section>

  </main>
  ${footer()}
  </body>
</html>
`;
}

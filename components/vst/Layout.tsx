import Head from 'next/head';
import Nav from './Nav';
import Footer from './Footer';

interface LayoutProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export default function Layout({ title, description, children }: LayoutProps) {
  const pageTitle = title
    ? `${title} — Voyage Smart Travels`
    : 'Voyage Smart Travels — AI Business Travel Management';
  const metaDesc = description ||
    'AI-powered business travel management for UK SMEs and public sector. Smarter booking, built-in compliance, full expense visibility.';

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDesc} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={metaDesc} />
        <meta property="og:type" content="website" />
        <link rel="icon" href="/favicon.svg" />
      </Head>
      <Nav />
      <main>{children}</main>
      <Footer />
    </>
  );
}

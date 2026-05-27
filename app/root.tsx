import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import { themeBootScript } from "~/lib/theme";

import type { Route } from "./+types/root";
import "./app.css";

export const links: Route.LinksFunction = () => [
  {
    rel: "manifest",
    href: "/manifest.webmanifest",
  },
  { rel: "apple-touch-icon", href: "/icon.svg" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#010102" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <script
          dangerouslySetInnerHTML={{
            __html: themeBootScript(),
          }}
        />
        <Meta />
        <Links />
      </head>
      <body className="app-body">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "有点小炸，但还没到世界末日。";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "你点的页面不存在。"
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="page-main">
      <section className="glass-card error-card">
        <div className="section-kicker">异常</div>
        <h1>{message}</h1>
        <p>{details}</p>
      </section>
      {stack && (
        <pre className="glass-card stack-trace">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}

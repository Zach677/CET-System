import { NavLink, Link } from "react-router";

import { ThemeToggle } from "~/components/theme-toggle";
import { typeLabel, type ExamLevel, type ResourceType } from "~/lib/resources";

const levelTabs: Array<{ level: ExamLevel; label: string }> = [
  { level: "cet4", label: "四级" },
  { level: "cet6", label: "六级" },
];

const typeTabs: Array<{ type: ResourceType; label: string }> = Object.entries(typeLabel).map(
  ([type, label]) => ({ type: type as ResourceType, label }),
);

export function SiteShell({
  title,
  description,
  children,
  level,
  eyebrow,
  actions,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  level?: ExamLevel;
  eyebrow?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="page-shell">
      <a className="skip-link" href="#main-content">
        跳到内容
      </a>
      <div className="app-shell">
        <aside className="site-sidebar" aria-label="工作台导航">
          <div className="site-sidebar__inner">
            <Link className="brand-mark" to="/">
              <span className="brand-glyph" aria-hidden="true">
                C
              </span>
              <span>CET Workbench</span>
            </Link>
            <nav className="brand-nav" aria-label="主导航">
              <NavLink to="/" end>
                首页
              </NavLink>
              <NavLink to="/import">导入</NavLink>
              {levelTabs.map((tab) => (
                <NavLink key={tab.level} to={`/${tab.level}`}>
                  {tab.label}
                </NavLink>
              ))}
            </nav>

            {level ? (
              <nav className="section-tabs" aria-label="分类导航">
                <span className="nav-label">资源分类</span>
                <NavLink to={`/${level}`} end>
                  概览
                </NavLink>
                {typeTabs.map((tab) => (
                  <NavLink key={tab.type} to={`/${level}/${tab.type}`}>
                    {tab.label}
                  </NavLink>
                ))}
              </nav>
            ) : null}

            <div className="sidebar-footer">
              <ThemeToggle />
            </div>
          </div>
        </aside>

        <main className="page-main" id="main-content">
          <header className="page-topbar">
            <div className="page-topbar__heading">
              {eyebrow ? <span className="page-eyebrow">{eyebrow}</span> : null}
              <h1>{title}</h1>
            </div>
            {actions ? <div className="page-topbar__actions">{actions}</div> : null}
          </header>
          {description ? <p className="page-lede">{description}</p> : null}

          {children}
        </main>
      </div>
    </div>
  );
}

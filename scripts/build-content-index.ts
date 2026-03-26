import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

type ResourceRecord = {
  id: string;
  level: "cet4" | "cet6";
  type: "papers" | "mocks" | "skills" | "listening" | "resources";
  title: string;
  summary: string;
  tags: string[];
};

async function readCollection(relativePath: string) {
  const filepath = resolve(process.cwd(), relativePath);
  const raw = await readFile(filepath, "utf8");
  return JSON.parse(raw) as ResourceRecord[];
}

async function main() {
  const [cet4, cet6] = await Promise.all([
    readCollection("content/cet4/resources.json"),
    readCollection("content/cet6/resources.json"),
  ]);

  const searchIndex = [...cet4, ...cet6].map((resource) => ({
    id: resource.id,
    level: resource.level,
    type: resource.type,
    title: resource.title,
    summary: resource.summary,
    tags: resource.tags,
    href: `/resources/${resource.id}`,
  }));

  await mkdir(resolve(process.cwd(), "content/generated"), { recursive: true });
  await writeFile(
    resolve(process.cwd(), "content/generated/search-index.json"),
    JSON.stringify(searchIndex, null, 2),
    "utf8",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

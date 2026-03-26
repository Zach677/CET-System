import { openDB } from "idb";

const DB_NAME = "cet-workbench";
const DB_VERSION = 1;

type StudyRecord = {
  resourceId: string;
  durationMinutes: number;
  note?: string;
  bucket: string;
  createdAt?: string;
};

type Snapshot = {
  favorites: string[];
  recentStudy: Array<StudyRecord & { createdAt: string }>;
  cachedResources: string[];
};

async function withDatabase<T>(work: (database: Awaited<ReturnType<typeof openDB>>) => Promise<T>) {
  const database = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains("kv")) {
        database.createObjectStore("kv");
      }
    },
  });

  try {
    return await work(database);
  } finally {
    database.close();
  }
}

async function getValue<T>(key: string, fallback: T): Promise<T> {
  return withDatabase(async (database) => {
    const value = await database.get("kv", key);
    return (value as T | undefined) ?? fallback;
  });
}

async function setValue(key: string, value: unknown) {
  await withDatabase(async (database) => {
    await database.put("kv", value, key);
  });
}

export function createLocalFirstStore() {
  return {
    async toggleFavorite(resourceId: string) {
      const favorites = await getValue<string[]>("favorites", []);
      const nextFavorites = favorites.includes(resourceId)
        ? favorites.filter((entry) => entry !== resourceId)
        : [...favorites, resourceId];

      await setValue("favorites", nextFavorites);
    },

    async listFavorites() {
      return getValue<string[]>("favorites", []);
    },

    async recordStudy(record: StudyRecord) {
      const recentStudy = await getValue<Array<StudyRecord & { createdAt: string }>>(
        "recentStudy",
        [],
      );

      const nextRecord = {
        ...record,
        createdAt: record.createdAt ?? new Date().toISOString(),
      };

      await setValue("recentStudy", [nextRecord, ...recentStudy].slice(0, 12));
    },

    async markCached(resourceId: string, label: string) {
      const cachedResources = await getValue<string[]>("cachedResources", []);
      const cacheKey = `${resourceId}::${label}`;

      if (!cachedResources.includes(cacheKey)) {
        await setValue("cachedResources", [...cachedResources, cacheKey]);
      }
    },

    async getSnapshot(): Promise<Snapshot> {
      const [favorites, recentStudy, cachedResources] = await Promise.all([
        getValue<string[]>("favorites", []),
        getValue<Array<StudyRecord & { createdAt: string }>>("recentStudy", []),
        getValue<string[]>("cachedResources", []),
      ]);

      return {
        favorites,
        recentStudy,
        cachedResources,
      };
    },
  };
}

import cet4ResourcesJson from "../../content/cet4/resources.json";
import cet6ResourcesJson from "../../content/cet6/resources.json";

import {
  resourceCollectionSchema,
  type ExamLevel,
  type ResourceRecord,
  type ResourceType,
} from "~/lib/resources";

export type ResourceFilters = {
  level?: ExamLevel;
  type?: ResourceType;
  query?: string;
};

export type ResourceRepository = {
  /** Returns cloned resources in repository order; JSON is newest first. */
  list(filters?: ResourceFilters): Promise<ResourceRecord[]>;
  findById(resourceId: string): Promise<ResourceRecord | null>;
};

function cloneResource(resource: ResourceRecord) {
  return structuredClone(resource);
}

function matchesQuery(resource: ResourceRecord, query: string) {
  return [resource.title, resource.summary, resource.tags.join(" ")]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

export function createJsonResourceRepository(
  input: unknown[],
): ResourceRepository {
  const resources = resourceCollectionSchema
    .parse(input)
    .sort(
      (left, right) =>
        right.year - left.year || left.title.localeCompare(right.title, "zh-CN"),
    );

  return {
    async list(filters: ResourceFilters = {}) {
      const normalizedQuery = filters.query?.trim().toLowerCase();

      return resources
        .filter((resource) => {
          if (filters.level && resource.level !== filters.level) {
            return false;
          }

          if (filters.type && resource.type !== filters.type) {
            return false;
          }

          if (!normalizedQuery) {
            return true;
          }

          return matchesQuery(resource, normalizedQuery);
        })
        .map(cloneResource);
    },

    async findById(resourceId: string) {
      const resource = resources.find((resource) => resource.id === resourceId);

      return resource ? cloneResource(resource) : null;
    },
  };
}

export const jsonResourceRepository = createJsonResourceRepository([
  ...cet4ResourcesJson,
  ...cet6ResourcesJson,
]);

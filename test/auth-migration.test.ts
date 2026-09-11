import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = resolve(process.cwd(), "drizzle/0001_seed_dev_admin.sql");

describe("default admin migration", () => {
  it("provisions the development admin credential without storing its plaintext password", () => {
    const migration = readFileSync(migrationPath, "utf8");

    expect(migration).toContain("dev@cafe.co.id");
    expect(migration).toContain("user-dev-admin");
    expect(migration).toContain("account-dev-admin");
    expect(migration).not.toContain("Cafe123@");
    expect(migration).toMatch(/[0-9a-f]{32}:[0-9a-f]{128}/);
  });
});

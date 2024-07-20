import Client from "@replit/database";

// database client

const db = new Client();

// utility functions

export async function getCurrentMaxTokenId() {
  return db.get("max_token_id")
    .then(({ ok, value }) => {
      if (!ok) {
        return 0;
      }
      return value;
    });
}

export async function setCurrentMaxTokenId(id) {
  await db.set("max_token_id", Number(id));
}
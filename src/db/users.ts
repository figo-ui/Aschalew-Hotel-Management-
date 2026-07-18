import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, displayName?: string, photoUrl?: string) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
        displayName: displayName || null,
        photoUrl: photoUrl || null,
        role: 'guest', // Default to guest
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          displayName: displayName || null,
          photoUrl: photoUrl || null,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Database user upsert failed:", error);
    // Fallback: try to select
    try {
      const selectResult = await db.select().from(users).where(eq(users.uid, uid));
      if (selectResult.length > 0) {
        return selectResult[0];
      }
    } catch (innerError) {
      console.error("Database fallback selection failed:", innerError);
    }
    throw new Error("Failed to authenticate or register user in database.", { cause: error });
  }
}

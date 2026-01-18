import { SvelteKitAuth } from "@auth/sveltekit"
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import Keycloak from "@auth/sveltekit/providers/keycloak";
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
 
export const { handle, signIn, signOut } = SvelteKitAuth({
	trustHost: true,
	adapter: DrizzleAdapter(db),
	events: {
		signIn: async ({user, profile, account}) => {
				let user_id = user?.id;
				let keycloakUsername = profile?.preferred_username;
				if (keycloakUsername === undefined || keycloakUsername === null || user_id === undefined) return;
				await db.update(users)
					.set({ username: keycloakUsername })
					.where(eq(users.id, user_id));
				//await db.update(users).set({ name: username }).where(eq(users.id, user_id));
			}
	},
	callbacks: {
		session: async ({ session }) => {
			return {
				expires: session.expires,
				user: session.user
			};
		}
	},
	providers: [
		Keycloak({
      authorization: { 
        params: { 
          prompt: 'login'
        } 
      },
			profile(profile) {
        return {
          id: profile.sub,
          name: profile.name ?? profile.preferred_username,
          email: profile.email,
          image: profile.picture,
          username: profile.preferred_username 
        };
      }
		})
	]
  /*async (event) => {
  const authOptions = {
    providers: [Keycloak],
  }
  return authOptions}*/
})
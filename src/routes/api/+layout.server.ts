import type { LayoutServerLoad } from "./$types"
import { rethrowAsKitError } from "$lib/server/http/appError";
import { requireAdminSession } from "$lib/server/http/guards";

export const load: LayoutServerLoad = async (event) => {
  try {
    const session = await event.locals.auth();
    const auth = await requireAdminSession(session);

    return {
      session: auth.session,
      my_user: auth.user,
    }
  } catch (caught) {
    rethrowAsKitError(caught)
  }
}

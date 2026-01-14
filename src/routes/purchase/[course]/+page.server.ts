/*import { db } from '$lib/server/db';
import { course, order, users } from "$lib/server/db/schema";
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from '../../$types';


export const load: PageServerLoad = async (event) => {
	let session = await event.locals.auth();
	let user_id = session?.user?.id;
	let courseId = event.params;
}*/

import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { order } from '$lib/server/db/schema';

export const actions: Actions = {
    buyCourse: async (event) => {
        const session = await event.locals.auth();
        const user_id = session?.user?.id;
        const course_id = event.params.course;

        if (!user_id) {
            return fail(401, { message: "You must be logged in to buy a course" });
        }

        try {
            // 2. Database Operation
			//TODO: Payment gate config
			await db.insert(order).values({userId: user_id, companyId: null, courseId: course_id, invoiceId: null, paymentStatus: "Not paid"});
        } catch (err) {
            console.error(err);
            return fail(500, { message: "Failed to process order" });
        }
        throw redirect(303, '/dashboard');
    }
};
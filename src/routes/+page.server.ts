import type { Actions, PageServerLoad } from "./$types";
import { db } from '$lib/server/db';
import { chapter, course, order, roles } from "$lib/server/db/schema";
import { eq } from 'drizzle-orm';
import { redirect } from "@sveltejs/kit";


export const load: PageServerLoad = async (event) => {
	let session = await event.locals.auth();
	let user_id = session?.user?.id;
	let coursesFromDb = await db.select().from(course).where(eq(course.isPublished, true));
	let isAdmin = false;
	let courses = coursesFromDb.map((c) =>({
		id: c.id,
    	title: c.title,
    	price: c.price,
    	shortDescription: c.shortDescription,
    	image: c.image,
    	isOwned: false
	}));
	if (!user_id){
		return  {courses, isAdmin}
	}
	let userRole = await db.select({role: roles.roleName}).from(roles).where(eq(roles.userId, user_id));
	if (userRole.some(r => r.role === 'admin')) {
    	isAdmin = true;
	}
	let userOwned = await db.select().from(order).where(eq(order.userId, user_id))
						.leftJoin(course, eq(order.courseId, course.id));
	
	userOwned.forEach(row => {
    	if (row.course) {
            const courseToUpdate = courses.find(c => c.id === row.course?.id);
            if (courseToUpdate) {
                courseToUpdate.isOwned = true;
            }
        }
    });
	
    return { courses, isAdmin };
};

export const actions: Actions = {
    addCourse: async ({ request, params }) => {
		let cId = await db.insert(course)
						   .values({title: "",
									price: 0,
									shortDescription: "",
									image: "",
									isPublished: false})
						   .returning({id: course.id});
		
		let chId = cId[0].id;
			
		await db.insert(chapter)
					.values({
						courseId: chId,
						content: null,
						indexInCourse: 1
					})
					.returning({
						id: chapter.id,
						content: chapter.content
		});
        throw redirect(303, `/courses/createCourse/${chId}`);
    }
};
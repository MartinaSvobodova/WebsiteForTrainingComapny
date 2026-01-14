/*
import type Course from '$lib/components/Course.svelte';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({locals:{postgres}}) => {
	const course_sql = `SELECT id, title FROM course`;
	const courses: Course[] = (await postgres.query(course_sql)).rows;
	return {
		courses
	};
};*/

import type { PageServerLoad } from "./$types";
import { db } from '$lib/server/db';
import { course, order, users } from "$lib/server/db/schema";
import { eq } from 'drizzle-orm';


export const load: PageServerLoad = async (event) => {
	let session = await event.locals.auth();
	let user_id = session?.user?.id;
	let coursesFromDb = await db.select().from(course);
	let courses = coursesFromDb.map((c) =>({
		id: c.id,
    	title: c.title,
    	price: c.price,
    	shortDescription: c.shortDescription,
    	image: c.image,
    	isOwned: false
	}));
	if (!user_id){
		return  {courses}
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
	
    return { courses };
}
import type { Actions, PageServerLoad } from "./$types";
import { db } from '$lib/server/db';
import { chapter, course} from "$lib/server/db/schema";
import { and, eq, gt, sql } from 'drizzle-orm';
import { redirect } from "@sveltejs/kit";

export const load: PageServerLoad = async ({params}) => {
    console.log(params.id);
    let chaptersFromDb = await db.select({
        chapterId: chapter.id,
        content: chapter.content, 
        indexInCourse: chapter.indexInCourse
    })
    .from(chapter)
    .where(eq(chapter.courseId, params.id))
    .orderBy(chapter.indexInCourse);

    return {
        information: {
            chapters: chaptersFromDb,
            numberOfChapters: chaptersFromDb.length,
            courseId: params.id,
            sChContent: chaptersFromDb[0]?.content ?? ""
        }
    };
}

export const actions: Actions = {
    createChapter: async ({ params, request }) => {
        let data = await request.formData();
        let nextIndex = Number(data.get('nextIndex'));
        let newChapters = await db.insert(chapter).values({
            courseId: params.id,
            content: null,
            indexInCourse: nextIndex
        }).returning({ 
            chapterId: chapter.id,
            indexInCourse: chapter.indexInCourse 
        });
        return { success: true, newChapter: newChapters[0] };
    },
    reorderChapters: async ({ request }) => {
        const data = await request.formData();
        const newOrder = JSON.parse(data.get('newOrder') as string);

        await db.transaction(async (tx) => {
            for (const item of newOrder) {
                await tx.update(chapter)
                    .set({ indexInCourse: item.newIndex })
                    .where(eq(chapter.id, item.id));
            }
        });

        return { success: true };
    },
    removeChapter: async ({ request, params }) => {
        const data = await request.formData();
        const idToDelete = data.get('chapterId') as string;
        const indexToDelete = Number(data.get('index'));
        const courseId = params.id;
        await db.transaction(async (tx) => {
            await tx.delete(chapter).where(eq(chapter.id, idToDelete));
            await tx.update(chapter)
                .set({
                    indexInCourse: sql`${chapter.indexInCourse} - 1`
                })
                .where(
                    and(
                        eq(chapter.courseId, courseId),
                        gt(chapter.indexInCourse, indexToDelete)
                    )
                );
        });
        let chaptersFromDb = await db.select({
            chapterId: chapter.id, 
            content: chapter.content,
            indexInCourse: chapter.indexInCourse
        })
        .from(chapter)
        .where(eq(chapter.courseId, courseId))
        .orderBy(chapter.indexInCourse);
        return { 
            success: true, 
            updatedChapters: {
                chapters: chaptersFromDb, 
                numberOfChapters: chaptersFromDb.length
            }
        };
    },
    editChapter: async ({ request }) =>{
        const data = await request.formData();
        const selectedId = data.get('chapterId') as string;
        let contentFromDb = await db.select({content: chapter.content})
                            .from(chapter)
                            .where(eq(chapter.id, selectedId));
        return {success: true, content: contentFromDb};
    },
    saveContent: async ({ request }) => {
        const data = await request.formData();
        const id = data.get('chapterId')?.toString();
        const html = data.get('content')?.toString();
        if (!id || html === undefined) return { success: false };
        try {
            await db.update(chapter)
                .set({ content: html })
                .where(eq(chapter.id, id));
            return { success: true };
        } catch (err) {
            console.error("Database Save Error:", err);
            return { success: false };
        }
    },
    publishCourse: async ({ request, params }) => {
        const data = await request.formData();
        const name = data.get('courseName') as string;
        const price = Number(data.get('coursePrice'));
        const image = data.get('courseImage') as File;
        await db.update(course)
                .set({
                    title: name,
                    price: price,
                    image: image.name,
                    isPublished: true})
                .where(eq(course.id, params.id));
        throw redirect(303, `/`);
    }
};
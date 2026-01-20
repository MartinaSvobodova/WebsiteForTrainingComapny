<script lang="ts">
	import QuillEditor from "$lib/components/QuillEditor.svelte";
	import { onMount } from "svelte";
	import type { PageProps } from "./$types";
	import { enhance } from "$app/forms";
	import { updated } from "$app/state";

	let sortable_element: HTMLElement;
	let { data }: PageProps = $props();
    
    // Initialize state directly from the data prop
    let chapterList = $state(data.information.chapters);
    let nOfChapters = $state(data.information.numberOfChapters);
	let selectedChapter = $state(1);

	console.log(data);
    
    // Safety check for the first ID
    let currentChapterId = $state(data.information.chapters[0]?.chapterId || "");
    let selectedChapterContent = $state(data.information.sChContent || "");

	let courseName = $state("");
    let coursePrice = $state(0);
	let courseImage = $state<FileList>();

	let isPublishable = $derived(
        courseName.trim().length > 0 && 
        coursePrice > 0 && 
        courseImage && courseImage.length > 0
    );

	onMount(async ()=>{
		const {Sortable} = await import("sortablejs");
		Sortable.create(sortable_element, {onEnd:async (event)=>{
			const movedItem = chapterList.splice(event.oldIndex, 1)[0]
			chapterList.splice(event.newIndex, 0, movedItem);
			const newOrder = chapterList.map((ch, i) => ({
                    id: ch.chapterId,
                    newIndex: i + 1
            }));
			const formData = new FormData();
                formData.append('newOrder', JSON.stringify(newOrder));
                
                await fetch('?/reorderChapters', {
                    method: 'POST',
                    body: formData
            });
		}});
	});

	function preparePublishData({ formData }) {
        formData.append('courseName', courseName);
        formData.append('coursePrice', coursePrice.toString());
        
        // Append the actual file object
        if (courseImage && courseImage.length > 0) {
            formData.append('courseImage', courseImage[0]);
        }
        
        return async ({ result, update }) => {
            await update(); 
        };
    }

	async function autoSave(html: string, id: string) {
        if (!id || id === "undefined") return;

        const formData = new FormData();
        formData.append('chapterId', id);
        formData.append('content', html);

        const response = await fetch('?/saveContent', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) console.log(`Successfully saved ${id}`);
    };

	function addChapter() {
    return async ({ result }) => {
        if (result.type === 'success' && result.data?.newChapter) {
	            chapterList = [...chapterList, result.data.newChapter];
    	        nOfChapters = chapterList.length;
	        if (!currentChapterId) {
                	currentChapterId = result.data.newChapter.chapterId;
            	}
        	}
    	};
	}

	function removeChapter() {
		return async ({result}) => {
			if (result.type === 'success' && result.data?.updatedChapters){
				chapterList = result.data?.updatedChapters.chapters;
				nOfChapters = result.data?.updatedChapters.numberOfChapters;
			}
		}
	}

	function editChapter(chapterNumber: number, chapterId: string) {
    	return async ({ result }) => {
	        if (result.type === 'success' && result.data?.content) {
	            const rawContent = result.data.content[0]?.content ?? "";
    	        currentChapterId = chapterId;
	            selectedChapterContent = rawContent; 
            	selectedChapter = chapterNumber;
        	}
    	};
	}
</script>

<label for="name">Course name</label>

<input
  type="text"
  id="name"
  name="name"
  required
  class="text-black"
  bind:value={courseName}/>

<label for="price">Course price in CZK</label>

<input
  type="number"
  id="price"
  name="price"
  required
  class="text-black"
  bind:value={coursePrice}/>

  <label for="image">Course image</label>

  <input
  type="file"
  id="image"
  name="image"
  required
  bind:files={courseImage}/>


<div class="flex flex-row">
	<div>
		<ul bind:this={sortable_element}>
    		{#each chapterList as ch, i (ch.chapterId || i)} 
        		<li >
            		Chapter {i + 1}
					<form method="POST" action="?/editChapter" use:enhance={() => editChapter(i+1, ch.chapterId)}>
    	                <input type="hidden" name="chapterId" value={ch.chapterId} />
	                    <button type="submit">Edit</button>
            	    </form>
					<form method="POST" action="?/removeChapter" use:enhance={() => removeChapter()}>
            		    <input type="hidden" name="chapterId" value={ch.chapterId} />
    		            <input type="hidden" name="index" value={i + 1} />
		                <button type="submit">
                    		Remove
                		</button>
                	</form>
		        </li>
	    	{/each}
		</ul>
		<form method="POST" action="?/createChapter" use:enhance={addChapter}>
   			<input type="hidden" name="nextIndex" value={chapterList.length + 1} />
    		<button type="submit">Add Chapter</button>
		</form>
	</div>
	<div>
		<h3>Current Chapter {selectedChapter}</h3>
	    {#key currentChapterId}
    	    <QuillEditor
        	    content={selectedChapterContent}
            	chapterId={currentChapterId}
	            onAutoSave={autoSave}
    	    />
    	{/key}
	</div>
</div>
<form method="POST" action="?/publishCourse" enctype="multipart/form-data" use:enhance={preparePublishData}>
	{#if isPublishable}
		<button type="submit">Publish Course</button>
	{/if}
</form>
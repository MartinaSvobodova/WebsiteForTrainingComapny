<script lang="ts">
	import { onMount, untrack } from "svelte";

	let { 
        content = "", 
        onAutoSave,
		chapterId = "",
        toolbarOptions = [
            [{ header: 1 }, { header: 2 }, "blockquote", "link", "image", "video"],
            ["bold", "italic", "underline", "strike"],
            [{ list: "ordered" }, { list: "bullet" }],
            [{ align: [] }],
            ["clean"]
        ] 
    } = $props();

	let quill: any;
    let editor: HTMLDivElement;
    let timer: ReturnType<typeof setTimeout>;

    $effect(() => {
        // We track chapterId. When it changes, we update the editor.
        const currentId = chapterId; 
        
        if (quill && currentId) {
			const newContent = untrack(() => content);
            
            quill.isUpdatingSilently = true;
            quill.root.innerHTML = newContent ?? ""; 
            quill.isUpdatingSilently = false;
        }
    });

	// Configuration
	/*export let toolbarOptions = [
		[{ header: 1 }, { header: 2 }, "blockquote", "link", "image", "video"],
		["bold", "italic", "underline", "strike"],
		[{ list: "ordered" }, { list: "bullet" }],
		[{ align: [] }],
		["clean"]
	];*/

	async function uploadToCDN(file: File): Promise<string> {
		console.log(`Uploading ${file.type}...`);
		// Simulate network delay
		return new Promise(resolve => {
			if (file.type.startsWith('image/')) {
				resolve("https://picsum.photos/400/300");
			} else {
				resolve("https://www.w3schools.com/html/mov_bbb.mp4");
			}
		});
	}

	onMount(async () => {
		const { default: Quill } = await import("quill");

		(window as any).Quill = Quill;

    	// 2. IMPORT properly: extract the .default property
    	// @ts-ignore
    	const resizeModule = await import('quill-resize-module');
    	const QuillResize = resizeModule.default;

    	// 3. REGISTER
    	Quill.register('modules/resize', QuillResize);
		
		// 1. Register Custom Video Blot (so videos are <video> not <iframe>)
		const BlockEmbed: any = Quill.import('blots/block/embed');

		class VideoBlot extends BlockEmbed {
			static create(url: string) {
				const node = super.create();
				node.setAttribute('src', url);
				node.setAttribute('controls', '');
				node.setAttribute('width', '100%');
				return node;
			}
			static value(node: Element) { return node.getAttribute('src'); }
		}
		VideoBlot.blotName = 'video-file';
		VideoBlot.tagName = 'video';
		Quill.register(VideoBlot);

		// 2. Logic to Process Files (Upload -> Insert)
		async function processFile(file: File) {
			const isImage = file.type.startsWith('image/');
			const isVideo = file.type.startsWith('video/');

			if (!isImage && !isVideo) return;

			// Remember cursor position
			const range = quill.getSelection(true) || { index: quill.getLength() };

			try {
				const url = await uploadToCDN(file);

				if (isImage) {
					quill.insertEmbed(range.index, 'image', url);
				} else {
					quill.insertEmbed(range.index, 'video-file', url);
				}
				quill.setSelection(range.index + 1);
			} catch (e) {
				console.error("Upload failed", e);
			}
		}

		// 3. Initialize Quill
		let quill = new Quill(editor, {
			modules: {
				toolbar: {
					container: toolbarOptions,
					handlers: {
						// Button Handlers
						image: () => {
							const input = document.createElement('input');
							input.type = 'file';
							input.accept = 'image/*';
							input.click();
							input.onchange = () => input.files[0] && processFile(input.files[0]);
						},
						video: () => {
							const input = document.createElement('input');
							input.type = 'file';
							input.accept = 'video/*';
							input.click();
							input.onchange = () => input.files[0] && processFile(input.files[0]);
						}
					}
				},
				resize: {
					modules: ['DisplaySize', 'Resize', 'Keyboard'],
					selectedClass: 'selected',
					activeClass: 'active',
					embedTags: ['VIDEO', 'IFRAME'],
					parchment: {
						image: {
                    		attribute: ['width', 'height']
                		},
                		'video-file': {
                    		attribute: ['width', 'height']
                		}
            		},
					
					onActive: function (blot, target) {
                		// Triggered when an element is activated
					},
            		onInactive: function (blot, target) {
                		// Triggered when an element is deactivated
            		},
					onChangeSize: function (blot, target, size) {
                		// Triggered when element size changes
            		}
				}
			},
			theme: "snow",
			placeholder: "Write your story..."
		});

		if (content) {
            quill.root.innerHTML = content;
        }

        quill.on('text-change', (delta, oldDelta, source) => {
            if (source === 'user' && !quill.isUpdatingSilently) {
                clearTimeout(timer);
                const idToSave = chapterId;
                const htmlToSave = quill.root.innerHTML;

                timer = setTimeout(() => {
                    if (idToSave === chapterId) {
                        onAutoSave(htmlToSave, idToSave);
                    }
                }, 1000);
            }
        });

		// --- 4. THE FIX: PASTE LISTENER WITH CAPTURE ---
		quill.root.addEventListener('paste', (e: ClipboardEvent) => {
			const items = e.clipboardData?.items;
			if (!items) return;

			for (let i = 0; i < items.length; i++) {
				if (items[i].kind === 'file') {
					const file = items[i].getAsFile();
					if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {

						// STOP EVERYTHING IMMEDIATELY
						e.preventDefault();
						e.stopPropagation();

						processFile(file);
						return; // Found a file, stop checking other items
					}
				}
			}
		}, true); // <--- 'true' enables Capture Phase (Runs BEFORE Quill)

		// --- 5. DROP LISTENER ---
		quill.root.addEventListener('drop', (e: DragEvent) => {
			const files = e.dataTransfer?.files;
			if (files && files.length > 0) {
				const file = files[0];
				if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
					e.preventDefault();
					e.stopPropagation();
					processFile(file);
				}
			}
		}, true); // Capture phase here is good practice too

	});
</script>

<style>
    @import 'https://cdn.quilljs.com/1.3.6/quill.snow.css';

    :global(.ql-editor video),
    :global(.ql-editor img) {
        max-width: 100%;
        height: auto;
        display: block;
        margin: 10px 0;
    }
</style>

<div class="editor-wrapper bg-white text-black min-h-50">
	<div bind:this={editor}></div>
</div>

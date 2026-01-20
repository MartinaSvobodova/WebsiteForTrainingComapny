<script lang="ts">
    // Destructure title from $props()
    let { id, title, image, price, isOwned } = $props();
</script>

<div class="flex flex-row border-2 border-black m-4">
    <div>
        {image}
    </div>
    <div>
        {title}
    </div>
    {#if !isOwned}
        <div>
            Price: {price}
        </div>
    {/if}
    <div>
        {#if isOwned}
            <form action="/courses/"{id}>
                <button>Go to course</button>
            </form>
        {:else}
            <form action="/purchase/"{id}>
                <button>Buy course</button>
            </form>
        {/if}
    </div>
</div>
<script>
  import PostPreviewAuthor from "./PostPreviewAuthor.svelte";
  import PostPreviewPublishedDate from "./PostPreviewPublishedDate.svelte";

  export let author;
  export let publishedDate;
  export let classes;
</script>

<style>
  .post-meta {
    margin: 0;
    padding: 0;
  }
  .post-meta li {
    display: inline-block;
  }
  .post-meta li + li:before {
    content: "\00B7";
    font-weight: 900;
    color: #999;
    line-height: 1;
    vertical-align: middle;

    margin-right: 4px;
  }
</style>

{#if author || publishedDate}
  <ul class="post-meta {classes}">
    {#if author}
      <li>
        <PostPreviewAuthor {...author} />
      </li>
    {/if}
    {#if publishedDate}
      <li>
        <PostPreviewPublishedDate {publishedDate} />
      </li>
    {/if}
  </ul>
{/if}

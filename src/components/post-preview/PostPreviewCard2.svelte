<script>
  import PostPreviewCategory from "./PostPreviewCategory.svelte";
  import PostPreviewThumb from "./PostPreviewThumb.svelte";
  import PostPreviewPostMeta from "./PostPreviewPostMeta.svelte";
  import PostPreviewTitle from "./PostPreviewTitle.svelte";
  import PostPreviewExcerpt from "./PostPreviewExcerpt.svelte";

  export let title;
  export let description;
  export let url;
  export let author;
  export let categories;
  export let publishedDate;
  export let img;

  $: firstCategory = categories[0];
</script>

<style>
</style>

<article class="post">
  <PostPreviewThumb {img} {url} classes="-object-fit" />
  <div class="post-text">
    <PostPreviewTitle {url} {title} classes="" />
    <PostPreviewExcerpt {description} />
    <PostPreviewPostMeta {author} {publishedDate} classes="" />
  </div>
  <PostPreviewCategory {...firstCategory} classes="" />
</article>

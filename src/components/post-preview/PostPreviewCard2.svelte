<script>
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
  .post-text {
    width: 100%;
  }
</style>

<article class="post">
  <PostPreviewThumb {img} {url} {firstCategory} classes="-object-fit" />
  <div class="post-text">
    <PostPreviewTitle {url} {title} classes="" />
    <PostPreviewExcerpt {description} />
    <PostPreviewPostMeta {author} {publishedDate} classes="" />
  </div>
</article>

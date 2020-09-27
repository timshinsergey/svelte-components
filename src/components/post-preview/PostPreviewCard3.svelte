<script>
  import PostPreviewThumb from "./PostPreviewThumb.svelte";
  import PostPreviewPostMeta from "./PostPreviewPostMeta.svelte";
  import PostPreviewTitle from "./PostPreviewTitle.svelte";

  export let title;
  export let url;
  export let publishedDate;
  export let img;
</script>

<style>
  .post {
    --post-title-weight: 500;
    --post-title-size: 17px;
    --post-title-margin: 0 0 7px 0;

    --post-thumb-margin: 0;
    --post-thumb-resolution: 100%;

    display: grid;
    grid-template-columns: 80px 1fr;
    grid-gap: 18px;
    align-items: center;

    position: relative;
  }
  .post-text {
    width: 100%;
  }
</style>

<article class="post">
  <PostPreviewThumb {img} {url} classes="-object-fit" />
  <div class="post-text">
    <PostPreviewTitle {url} {title} classes="" />
    <PostPreviewPostMeta {publishedDate} classes="" />
  </div>
</article>

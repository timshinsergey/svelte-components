<script>
  import PostPreviewCategory from "./PostPreviewCategory.svelte";
  import PostPreviewThumb from "./PostPreviewThumb.svelte";
  import PostPreviewPostMeta from "./PostPreviewPostMeta.svelte";
  import PostPreviewTitle from "./PostPreviewTitle.svelte";

  export let title;
  export let url;
  export let author;
  export let categories;
  export let publishedDate;
  export let img;

  $: firstCategory = categories[0];
</script>

<style>
  .post {
    --post-title-color: #fff;
    --post-author-color: hsla(0, 0%, 100%, 0.85);
    --post-date-color: hsla(0, 0%, 100%, 0.85);
    --post-thumb-margin: 0;

    display: flex;
    align-items: flex-end;

    position: relative;
  }
  .post-text {
    padding: 25px 20px;
    width: 100%;
  }
  .post-text:before {
    content: "";

    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: -1;

    background-image: linear-gradient(
      0deg,
      #000 0,
      rgba(0, 0, 0, 0.917) 5.3%,
      rgba(0, 0, 0, 0.834) 10.6%,
      rgba(0, 0, 0, 0.753) 15.9%,
      rgba(0, 0, 0, 0.672) 21.3%,
      rgba(0, 0, 0, 0.591) 26.8%,
      rgba(0, 0, 0, 0.511) 32.5%,
      rgba(0, 0, 0, 0.433) 38.4%,
      rgba(0, 0, 0, 0.357) 44.5%,
      rgba(0, 0, 0, 0.283) 50.9%,
      rgba(0, 0, 0, 0.213) 57.7%,
      rgba(0, 0, 0, 0.147) 65%,
      rgba(0, 0, 0, 0.089) 72.9%,
      rgba(0, 0, 0, 0.042) 81.4%,
      rgba(0, 0, 0, 0.011) 90.6%,
      transparent 100%
    );
  }
</style>

<article class="post">
  <PostPreviewThumb {img} classes="-overlay -object-fit" />
  <div class="post-text">
    <PostPreviewTitle {url} {title} classes="-absolute-link" />
    <PostPreviewPostMeta {author} {publishedDate} classes="" />
  </div>
  <PostPreviewCategory {...firstCategory} classes="-top-left" />
</article>

<script>
  export let title;
  export let url;
  export let classes;
</script>

<style>
  .post-title {
    font-size: var(--post-title-size);
    color: var(--post-title-color);
    font-weight: var(--post-title-weight);
    line-height: 1.5;

    margin: var(--post-title-margin);
  }
  .post-title a {
    color: inherit;
  }
  .post-title.-absolute-link a:before {
    content: "";

    position: absolute;
    top: 0;
    left: 0;

    width: 100%;
    height: 100%;
  }
  .post-title a:hover,
  .post-title a:focus {
    text-decoration: none;
  }
</style>

<h3 class="post-title {classes}">
  {#if url}<a href={url}>{title}</a>{:else}{title}{/if}
</h3>

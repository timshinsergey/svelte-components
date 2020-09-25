<script>
  export let title;
  export let url;
  export let classes;
</script>

<style>
  .post-title {
    font-size: 27px;
    color: var(--post-title-color);
    line-height: 1.5;

    margin: 0 0 15px 0;
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

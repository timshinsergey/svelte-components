<script>
  export let name;
  export let url;
  export let img;
</script>

<style>
  .entry-author {
    display: inline-block;
  }
  .entry-author img {
    margin-right: 12px;
  }
  .entry-author img {
    width: 34px;
    height: 34px;

    border-radius: 50%;

    vertical-align: middle;
  }
  .entry-author a {
    font-size: 14px;
    color: var(--post-author-color);

    position: relative;
    z-index: 1;
  }
  .entry-author a:hover {
    text-decoration: none;
  }
</style>

<div class="entry-author">
  {#if img}<picture> <img src={img} alt="Аватар {name}" /> </picture>{/if}
  <a href={url}>{name}</a>
</div>

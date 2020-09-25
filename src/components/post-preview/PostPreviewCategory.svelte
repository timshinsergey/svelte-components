<script>
  export let url;
  export let name;
  export let classes;
</script>

<style>
  .post-cat {
    font-size: 12px;
    text-transform: uppercase;
    line-height: 1;
    letter-spacing: 1px;
    color: #fff;
    text-decoration: none;

    display: inline-flex;

    padding: 6px 11px;

    background-color: #fc3c2d;

    border-radius: 5px;
  }
  .post-cat.-top-left {
    position: absolute;
    top: 20px;
    left: 20px;
    z-index: 1;
  }
</style>

<a href="{url}" class="post-cat {classes}">{name}</a>

<script>
  export let classes;
  export let img;
  export let url;
  export let imgAlt = "";
</script>

<style>
  .post-thumb {
    position: relative;
    margin: var(--post-thumb-margin);
  }
  .post-thumb:before {
    content: '';
    display: block;
    padding-top: 70%;
  }
  .post-thumb img {
    position: absolute;
    top: 0;
    left: 0;
    
    width: 100%;
    height: 100%;
  }
  .post-thumb.-overlay {
    width: 100%;
    height: 100%;
  }
  .post-thumb.-object-fit img {
    object-fit: cover;
  }
  .post-thumb.-overlay {
    position: absolute;
    z-index: -2;

    background-color: #333;
  }
  .post-thumb.-overlay:before {
    content: initial;
  }
  .post-thumb.-overlay a:before {
    content: "";

    position: absolute;
    top: 0;
    left: 0;

    width: 100%;
    height: 100%;
  }
</style>

<div class="post-thumb {classes}">
  {#if url}
    <a href={url}> <picture> <img src={img} alt="{imgAlt}" /> </picture> </a>
  {:else}<picture> <img src={img} alt="{imgAlt}" /> </picture>{/if}
</div>

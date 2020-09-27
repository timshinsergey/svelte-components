<script>
  import SiteNavigation from "./SiteNavigation.svelte";
</script>

<style>
  .site-header {
    display: grid;
    grid-template-columns: max-content max-content max-content;
    justify-content: space-between;
  }
  .site-logo {
    font-weight: 700;
    font-size: 18px;
  }
  .site-logo:hover {
    text-decoration: none;
  }
  .site-logo div {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--menu-link-color);

    height: 60px;
    width: 120px;

    background-color: var(--accent-color);
  }
  .site-search {
    height: 60px;
    width: 120px;
  }
</style>

<header class="site-header">
  <a href="/" class="site-logo">
    <div>SomeSite</div>
  </a>

  <SiteNavigation />

  <div class="site-search" />
</header>

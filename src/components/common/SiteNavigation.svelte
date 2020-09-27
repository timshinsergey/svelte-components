<script>
  let sections = [
    {
      name: "About",
      url: "/about",
    },
    {
      name: "Contacts",
      url: "/contacts",
    },
    {
      name: "Services",
      url: "/services",
    },
    {
      name: "Projects",
      url: "/projects",
    },
  ];
</script>

<style>
    .site-nav ul {
        margin: 0;
        padding: 0;
    }
    .site-nav li,
    .site-nav a {
        display: inline-flex;
        align-items: center;
    }
    .site-nav a {
        font-weight: 700;
        font-size: 15px;
        color: var(--menu-link-color);
        text-transform: uppercase;
        letter-spacing: 0.1px;

        height: 60px;

        padding: 0 15px;

        border-bottom: 3px solid transparent;
    }
    .site-nav a:hover {
        text-decoration: none;

        border-bottom: 3px solid var(--accent-color);
    }
</style>

<nav class="site-nav">
  <ul>
    {#each sections as section}
      <li><a href={section.url}>{section.name}</a></li>
    {/each}
  </ul>
</nav>

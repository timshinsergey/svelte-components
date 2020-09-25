<script>
  import PostPreviewCard1 from "./components/post-preview/PostPreviewCard1.svelte";
  import PostPreviewCard2 from "./components/post-preview/PostPreviewCard2.svelte";
  export let name;
  let posts = [
    {
      title: "The Joy of Petty Grievances in Death Becomes Her",
      description:
        "Whoever said “It’s not about the destination. It’s the journey” never flew on a long haul flight. Those flights can be painful, tiresome, ...",
      url: '/post-url',
      author: {
        name: "bkninja",
        url: "/author",
      },
      categories: [
        {
          name: "Fashion",
          url: "/fashion",
        },
        {
          name: "Technology",
          url: "/technology",
        },
      ],
      publishedDate: "2019-10-18T08:37:03+00:00",
      img:
        "https://atbs.bk-ninja.com/ceris/wp-content/uploads/2020/04/ceris_12-400x300.jpg",
    },
    {
      title: "The Joy of Petty Grievances in Death Becomes Her1",
      description:
        "Whoever said “It’s not about the destination. It’s the journey” never flew on a long haul flight. Those flights can be painful, tiresome, ...",
      url: '/post-url',
      author: {
        name: "bkninja",
        url: "/author",
        img:
          "https://secure.gravatar.com/avatar/662a272c8be177be19f47db7acac0cb9?s=50&d=mm&r=g",
      },
      categories: [
        {
          name: "Fashion",
          url: "/fashion",
        },
        {
          name: "Technology",
          url: "/technology",
        },
      ],
      publishedDate: "2019-10-18T08:37:03+00:00",
      img:
        "https://atbs.bk-ninja.com/ceris/wp-content/uploads/2020/04/ceris_12-400x300.jpg",
    },
    {
      title: "The Joy of Petty Grievances in Death Becomes Her2",
      description:
        "Whoever said “It’s not about the destination. It’s the journey” never flew on a long haul flight. Those flights can be painful, tiresome, ...",
      url: '/post-url',
      author: {
        name: "bkninja",
        url: "/author",
        img:
          "https://secure.gravatar.com/avatar/662a272c8be177be19f47db7acac0cb9?s=50&d=mm&r=g",
      },
      categories: [
        {
          name: "Fashion",
          url: "/fashion",
        },
        {
          name: "Technology",
          url: "/technology",
        },
      ],
      publishedDate: "2019-10-18T08:37:03+00:00",
      img:
        "https://atbs.bk-ninja.com/ceris/wp-content/uploads/2020/04/ceris_12-400x300.jpg",
    },
    {
      title: "The Joy of Petty Grievances in Death Becomes Her3",
      description:
        "Whoever said “It’s not about the destination. It’s the journey” never flew on a long haul flight. Those flights can be painful, tiresome, ...",
      url: '/post-url',
      author: {
        name: "bkninja",
        url: "/author",
        img:
          "https://secure.gravatar.com/avatar/662a272c8be177be19f47db7acac0cb9?s=50&d=mm&r=g",
      },
      categories: [
        {
          name: "Fashion",
          url: "/fashion",
        },
        {
          name: "Technology",
          url: "/technology",
        },
      ],
      publishedDate: "2019-10-18T08:37:03+00:00",
      img:
        "https://atbs.bk-ninja.com/ceris/wp-content/uploads/2020/04/ceris_12-400x300.jpg",
    },
  ];
</script>

<style>
  main {
    padding: 1em;
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
  .posts-1 {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    grid-auto-flow: row dense;
    grid-gap: 10px;

    min-height: 470px;
  }
  .posts-2 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-gap: 40px;
  }
</style>

<main>
  <h1>Hello {name}!</h1>
  <p>
    Visit the <a href="https://svelte.dev/tutorial">Svelte tutorial</a> to learn
    how to build Svelte apps.
  </p>

  <section class="posts-1 -mosaic">
    {#each posts as post}
      <PostPreviewCard1 {...post}/>
    {/each}
  </section>
  <section class="posts-2">
    {#each posts as post}
      <PostPreviewCard2 {...post}/>
    {/each}
  </section>
</main>

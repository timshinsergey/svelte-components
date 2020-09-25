<script>
    export let publishedDate;
    $: title = new Date(publishedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    $: text = new Date(publishedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
</script>

<style>
    time {
        font-size: 12px;
        color: var(--post-date-color);
    }
</style>

<time
  datatime="{publishedDate}"
  title="{title}">{text}</time>

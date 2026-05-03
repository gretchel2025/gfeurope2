<script lang="ts">
    function refreshPage(){
        location.reload();
    }
</script>


<main class="container">

    <article>
        <hgroup>
            <h1>Server Busy</h1>
            <h2>Refresh and Retry</h2>
        </hgroup>

<!--        <a href="javascript: location.reload()" role="button">Refresh</a>-->
        <button type="button" on:click={refreshPage}>Refresh</button>
    </article>

    <a href="/api">admin home</a>

</main>

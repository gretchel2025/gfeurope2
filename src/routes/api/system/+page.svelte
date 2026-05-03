<script lang="ts">
    import type {ServerData} from "./+page.server";

    export let data: ServerData
</script>


<main class="container">
    <article>
        <hgroup>
            <h1>System</h1>
            <h1>System Admins Only</h1>
        </hgroup>

        New Bookings Allowed: {data.newBookingsAllowed}
        <form action="?/toggleNewBookingsAllowed" method="POST">
            <input type="submit" value="toggle"/>
        </form>
        <br>
        <a href="/api">admin home</a>
    </article>
</main>

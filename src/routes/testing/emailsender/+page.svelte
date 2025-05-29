<script lang="ts">
</script>

<main class="container">

    <article>
        <hgroup>
            <h1>Email Sender</h1>
            <h2>Send an email</h2>
        </hgroup>

        <form method="POST">
            <label>
                from*
                <input type="text" name="to" value="help@grandfeast.eu" disabled/>
            </label>
            <label>
                to*
                <input type="text" name="to" value="jonathangersam@gmail.com" required/>
            </label>
            <br>

            <label>
                subject*
                <input type="text" name="subject" value="testing 001" required/>
            </label>
            <br>

            <label>
                message
<!--                <input type="text" name="message" value="Hello, <strong>World!</strong> (test 001)"/>-->
                <textarea name="message" value="Hello, <strong>World!</strong> (test 001)"/>
            </label>

            <button type="submit">Send</button>
        </form>
    </article>

    <a href="/api">admin home</a>
</main>
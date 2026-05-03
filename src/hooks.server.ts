import {connectDB} from "$lib/server/data_sources/dbinit";
import {ensureRequiredData} from "$lib/server/bootstrap";
import * as ticketCounterWorkflows from "$lib/server/workflows/ticket_counters";
import * as errors from "$lib/entities/errors";

// doInitStuff is where I place code that should run at the start of tha app
async function doInitStuff(){
    console.log("[INFO] doInitStuff() initializing app...")

    const isDBConnected = await connectDB();
    if (!isDBConnected) {
        console.warn("[WARN] skipping DB bootstrap because the database connection is unavailable")
        return
    }

    await ensureRequiredData();

    // try to make at least 1 db call on startup. MAYBE this will 'warm up' the db connection
    try {
        await ticketCounterWorkflows.GetStandardTickets()
    } catch (e) {
        if (e === errors.ERR_DB_TIMEOUT) {
            console.error("[ERROR] ticketCounterWorkflows.GetStandardTickets() failed with ERR_DB_TIMEOUT")
        } else {
            console.error("[ERROR] ticketCounterWorkflows.GetStandardTickets() failed with some error", e)
        }
    }

    console.log("[INFO] doInitStuff() ...initialization done")
}

doInitStuff()

export { handle } from "./auth"

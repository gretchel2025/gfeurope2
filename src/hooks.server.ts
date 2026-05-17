import { bootstrapApplication } from "$lib/infrastructure/bootstrap/bootstrap";

await bootstrapApplication();

export { handle } from "./auth";

import { ResourceManager } from "./ResourceManager";
import { Resources } from "./Resources";

const resources = Resources.define(
    {
    default: {
        "en-US": {
            greeting: "Hello",
            error_404: "Not Found",
            maxRetries: 3
        },
    },
    fallback: {
        "es-ES": {
            greeting: "Hola",
            error_404: "No encontrado"
        },
    },
    others: {
        "pt-BR": {
            greeting: "Olá",
        },
        "pt-PT": {}
    },
});

const useResources = ResourceManager.specify(resources);

const resources2 = useResources();


import { ResourceManager } from "./ResourceManager";
import { Resources } from "./ResourceManager";

const resources = Resources.define({
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
            error_404: "No encontrado",
        },
    },
    others: {
        "pt-BR": {
            greeting: "Olá",
        },
        "pt-PT": {}
    },
});

const useResources = ResourceManager.configure(resources);

const resourceManager = useResources();

const value = resourceManager.setNamespace("es-ES");


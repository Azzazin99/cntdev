

export const index = 5;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/certificates/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/5.vk5zQJCg.js","_app/immutable/chunks/udxkyZ3h.js","_app/immutable/chunks/I8rQr1kY.js","_app/immutable/chunks/Czl-cN9Z.js"];
export const stylesheets = [];
export const fonts = [];

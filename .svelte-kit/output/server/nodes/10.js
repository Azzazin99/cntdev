

export const index = 10;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/plan/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/10.BCztlUqO.js","_app/immutable/chunks/udxkyZ3h.js","_app/immutable/chunks/I8rQr1kY.js","_app/immutable/chunks/Czl-cN9Z.js","_app/immutable/chunks/BTeJsfHk.js"];
export const stylesheets = [];
export const fonts = [];

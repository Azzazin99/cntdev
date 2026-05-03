

export const index = 3;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/activities/_page.svelte.js')).default;
export const imports = ["_app/immutable/nodes/3.n7eBzIK9.js","_app/immutable/chunks/udxkyZ3h.js","_app/immutable/chunks/I8rQr1kY.js","_app/immutable/chunks/Czl-cN9Z.js","_app/immutable/chunks/BTeJsfHk.js"];
export const stylesheets = ["_app/immutable/assets/3.DG8ZSoHt.css"];
export const fonts = [];

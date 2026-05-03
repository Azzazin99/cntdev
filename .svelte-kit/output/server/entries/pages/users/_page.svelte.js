import { c as head } from "../../../chunks/index-server.js";
//#region src/routes/users/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		head("9fk07v", $$renderer, ($$renderer) => {
			$$renderer.title(($$renderer) => {
				$$renderer.push(`<title>บุคลากร - กลุ่มพัฒนาครูฯ</title>`);
			});
		});
		$$renderer.push(`<div class="container"><h2 class="section-title">👥 บุคลากร</h2> `);
		$$renderer.push("<!--[0-->");
		$$renderer.push(`<p>กำลังโหลด...</p>`);
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
export { _page as default };

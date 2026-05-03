import { c as head } from "../../../chunks/index-server.js";
//#region src/routes/authority/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		head("1s4rtly", $$renderer, ($$renderer) => {
			$$renderer.title(($$renderer) => {
				$$renderer.push(`<title>อำนาจหน้าที่ - กลุ่มพัฒนาครูฯ</title>`);
			});
		});
		$$renderer.push(`<div class="container"><h2 class="section-title">⚖️ อำนาจหน้าที่</h2> `);
		$$renderer.push("<!--[0-->");
		$$renderer.push(`<p>กำลังโหลด...</p>`);
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
export { _page as default };

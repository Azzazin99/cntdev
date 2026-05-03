import { c as head } from "../../../chunks/index-server.js";
import "../../../chunks/utils2.js";
//#region src/routes/knowledge/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		head("u7nvcr", $$renderer, ($$renderer) => {
			$$renderer.title(($$renderer) => {
				$$renderer.push(`<title>คลังความรู้ - กลุ่มพัฒนาครูฯ</title>`);
			});
		});
		$$renderer.push(`<div class="container"><h2 class="section-title">📚 คลังความรู้</h2> `);
		$$renderer.push("<!--[0-->");
		$$renderer.push(`<p>กำลังโหลด...</p>`);
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
export { _page as default };

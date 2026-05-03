import { c as head } from "../../../chunks/index-server.js";
import "../../../chunks/utils2.js";
//#region src/routes/forms/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		head("j073pc", $$renderer, ($$renderer) => {
			$$renderer.title(($$renderer) => {
				$$renderer.push(`<title>แบบฟอร์ม - กลุ่มพัฒนาครูฯ</title>`);
			});
		});
		$$renderer.push(`<div class="container"><h2 class="section-title">📝 แบบฟอร์ม</h2> `);
		$$renderer.push("<!--[0-->");
		$$renderer.push(`<p>กำลังโหลด...</p>`);
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
export { _page as default };

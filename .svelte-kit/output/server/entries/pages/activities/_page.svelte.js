import { c as head } from "../../../chunks/index-server.js";
import "../../../chunks/utils2.js";
//#region src/routes/activities/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		head("geza2u", $$renderer, ($$renderer) => {
			$$renderer.title(($$renderer) => {
				$$renderer.push(`<title>ภาพกิจกรรม - กลุ่มพัฒนาครูฯ</title>`);
			});
		});
		$$renderer.push(`<div class="container"><h2 class="section-title">📸 ภาพกิจกรรม</h2> `);
		$$renderer.push("<!--[0-->");
		$$renderer.push(`<p>กำลังโหลด...</p>`);
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
export { _page as default };

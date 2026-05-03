import { c as head } from "../../../chunks/index-server.js";
import "../../../chunks/utils2.js";
//#region src/routes/news/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		head("1gc460s", $$renderer, ($$renderer) => {
			$$renderer.title(($$renderer) => {
				$$renderer.push(`<title>ข่าวประชาสัมพันธ์ - กลุ่มพัฒนาครูฯ</title>`);
			});
		});
		$$renderer.push(`<div class="container"><h2 class="section-title">📰 ข่าวประชาสัมพันธ์</h2> `);
		$$renderer.push("<!--[0-->");
		$$renderer.push(`<p>กำลังโหลด...</p>`);
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
export { _page as default };

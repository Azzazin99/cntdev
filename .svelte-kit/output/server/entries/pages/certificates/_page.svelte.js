import { c as head } from "../../../chunks/index-server.js";
//#region src/routes/certificates/+page.svelte
function _page($$renderer) {
	head("gbdbmt", $$renderer, ($$renderer) => {
		$$renderer.title(($$renderer) => {
			$$renderer.push(`<title>คลังเกียรติบัตร - กลุ่มพัฒนาครูฯ</title>`);
		});
	});
	$$renderer.push(`<div class="container"><h2 class="section-title">🏆 คลังเกียรติบัตร</h2> <p>หน้าคลังเกียรติบัตรกำลังอยู่ในระหว่างการพัฒนา</p></div>`);
}
//#endregion
export { _page as default };

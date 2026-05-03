import { U as attr, W as escape_html, Z as fallback, a as bind_props, c as head, d as store_get, et as getContext, f as stringify, i as attr_class, p as unsubscribe_stores, s as ensure_array_like, u as slot } from "../../chunks/index-server.js";
import "../../chunks/client.js";
//#region node_modules/@sveltejs/kit/src/runtime/app/stores.js
/**
* A function that returns all of the contextual stores. On the server, this must be called during component initialization.
* Only use this if you need to defer store subscription until after the component has mounted, for some reason.
*
* @deprecated Use `$app/state` instead (requires Svelte 5, [see docs for more info](https://svelte.dev/docs/kit/migrating-to-sveltekit-2#SvelteKit-2.12:-$app-stores-deprecated))
*/
var getStores = () => {
	const stores$1 = getContext("__svelte__");
	return {
		/** @type {typeof page} */
		page: { subscribe: stores$1.page.subscribe },
		/** @type {typeof navigating} */
		navigating: { subscribe: stores$1.navigating.subscribe },
		/** @type {typeof updated} */
		updated: stores$1.updated
	};
};
/**
* A readable store whose value contains page data.
*
* On the server, this store can only be subscribed to during component initialization. In the browser, it can be subscribed to at any time.
*
* @deprecated Use `page` from `$app/state` instead (requires Svelte 5, [see docs for more info](https://svelte.dev/docs/kit/migrating-to-sveltekit-2#SvelteKit-2.12:-$app-stores-deprecated))
* @type {import('svelte/store').Readable<import('@sveltejs/kit').Page>}
*/
var page = { subscribe(fn) {
	return getStores().page.subscribe(fn);
} };
//#endregion
//#region src/components/Header.svelte
function Header($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		var $$store_subs;
		let navItems = fallback($$props["navItems"], () => [], true);
		let toggleTheme = fallback($$props["toggleTheme"], () => {});
		let currentTheme = fallback($$props["currentTheme"], "light");
		$$renderer.push(`<header class="main-header svelte-oiwvqb"><a href="/"><img src="/assets/images/banner.png" alt="กลุ่มพัฒนาครูและบุคลากรทางการศึกษา" class="responsive-banner svelte-oiwvqb"/></a></header> <nav class="sticky-nav svelte-oiwvqb"><div class="nav-container svelte-oiwvqb"><ul class="nav-menu svelte-oiwvqb"><!--[-->`);
		const each_array = ensure_array_like(navItems);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let item = each_array[$$index];
			$$renderer.push(`<li><a${attr("href", item.link)}${attr_class(`nav-link ${stringify(store_get($$store_subs ??= {}, "$page", page).url.pathname === item.link ? "active" : "")}`, "svelte-oiwvqb")}>${escape_html(item.text)}</a></li>`);
		}
		$$renderer.push(`<!--]--> <li><button class="theme-toggle svelte-oiwvqb" aria-label="Toggle theme">`);
		if (currentTheme === "dark") {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`☀️`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`🌙`);
		}
		$$renderer.push(`<!--]--></button></li></ul></div></nav>`);
		if ($$store_subs) unsubscribe_stores($$store_subs);
		bind_props($$props, {
			navItems,
			toggleTheme,
			currentTheme
		});
	});
}
//#endregion
//#region src/components/Footer.svelte
function Footer($$renderer) {
	$$renderer.push(`<footer class="main-footer svelte-1sr6y3t"><section class="logo-section svelte-1sr6y3t"><div class="logo-grid svelte-1sr6y3t"><a href="https://www.moe.go.th" target="_blank" class="logo-link svelte-1sr6y3t" title="กระทรวงศึกษาธิการ"><img src="/assets/images/logos/moe.png" alt="กระทรวงศึกษาธิการ" class="svelte-1sr6y3t"/></a> <a href="https://www.ocsc.go.th" target="_blank" class="logo-link svelte-1sr6y3t" title="ก.ค.ศ."><img src="/assets/images/logos/ocsc.png" alt="ก.ค.ศ." class="svelte-1sr6y3t"/></a> <a href="https://www.obec.go.th" target="_blank" class="logo-link svelte-1sr6y3t" title="สพฐ."><img src="/assets/images/logos/obec.png" alt="สพฐ." class="svelte-1sr6y3t"/></a> <a href="https://www.otepc.go.th" target="_blank" class="logo-link svelte-1sr6y3t" title="อปท."><img src="/assets/images/logos/otepc.png" alt="อปท." class="svelte-1sr6y3t"/></a> <a href="https://personnel.obec.go.th" target="_blank" class="logo-link svelte-1sr6y3t" title="ระบบบุคลากร"><img src="/assets/images/logos/personnel.png" alt="ระบบบุคลากร" class="svelte-1sr6y3t"/></a> <a href="https://hrms.moe.go.th" target="_blank" class="logo-link svelte-1sr6y3t" title="HRMS"><img src="/assets/images/logos/hrms.png" alt="HRMS" class="svelte-1sr6y3t"/></a></div></section> <div class="footer-content svelte-1sr6y3t"><div class="footer-section svelte-1sr6y3t"><h3 class="svelte-1sr6y3t">กลุ่มพัฒนาครูและบุคลากรทางการศึกษา</h3> <p class="svelte-1sr6y3t">ถนนวิเชียรปราการ ตำบลในเมือง อำเภอเมือง จังหวัดชัยนาท 17000</p> <p class="svelte-1sr6y3t">โทรศัพท์: 056-411639 ต่อ 11</p></div> <div class="footer-section svelte-1sr6y3t"><p class="svelte-1sr6y3t">© 2025 กลุ่มพัฒนาครูและบุคลากรทางการศึกษา สพป.ชัยนาท</p></div></div></footer>`);
}
//#endregion
//#region src/routes/+layout.svelte
function _layout($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const navItems = [
			{
				text: "หน้าหลัก",
				link: "/"
			},
			{
				text: "บุคลากร",
				link: "/users"
			},
			{
				text: "อำนาจหน้าที่",
				link: "/authority"
			},
			{
				text: "คู่มือการปฏิบัติงาน",
				link: "/manual"
			},
			{
				text: "แผนพัฒนาครู",
				link: "/plan"
			},
			{
				text: "ข่าวประชาสัมพันธ์",
				link: "/news"
			},
			{
				text: "ภาพกิจกรรม",
				link: "/activities"
			},
			{
				text: "แบบฟอร์ม",
				link: "/forms"
			}
		];
		let currentTheme = "light";
		function toggleTheme() {
			document.body.classList.toggle("dark-mode");
			currentTheme = document.body.classList.contains("dark-mode") ? "dark" : "light";
			localStorage.setItem("site_theme", currentTheme);
		}
		head("12qhfyh", $$renderer, ($$renderer) => {
			$$renderer.push(`<meta charset="UTF-8"/> <meta name="viewport" content="width=device-width, initial-scale=1.0"/> <link rel="icon" href="/favicon.ico"/> <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&amp;display=swap" rel="stylesheet"/>`);
		});
		$$renderer.push(`<div class="site-wrapper svelte-12qhfyh">`);
		Header($$renderer, {
			navItems,
			toggleTheme,
			currentTheme
		});
		$$renderer.push(`<!----> <main class="svelte-12qhfyh"><!--[-->`);
		slot($$renderer, $$props, "default", {}, null);
		$$renderer.push(`<!--]--></main> `);
		Footer($$renderer, {});
		$$renderer.push(`<!----></div>`);
	});
}
//#endregion
export { _layout as default };

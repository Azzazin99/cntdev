
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	type MatcherParam<M> = M extends (param : string) => param is (infer U extends string) ? U : string;

	export interface AppTypes {
		RouteId(): "/" | "/activities" | "/authority" | "/certificates" | "/forms" | "/knowledge" | "/manual" | "/news" | "/plan" | "/users";
		RouteParams(): {
			
		};
		LayoutParams(): {
			"/": Record<string, never>;
			"/activities": Record<string, never>;
			"/authority": Record<string, never>;
			"/certificates": Record<string, never>;
			"/forms": Record<string, never>;
			"/knowledge": Record<string, never>;
			"/manual": Record<string, never>;
			"/news": Record<string, never>;
			"/plan": Record<string, never>;
			"/users": Record<string, never>
		};
		Pathname(): "/" | "/activities" | "/authority" | "/certificates" | "/forms" | "/knowledge" | "/manual" | "/news" | "/plan" | "/users";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/assets/components/footer.html" | "/assets/components/header.html" | "/assets/css/orgchart.css" | "/assets/css/style.css" | "/assets/data/activities.json" | "/assets/data/authority.json" | "/assets/data/cnt_clone.code-workspace" | "/assets/data/forms.json" | "/assets/data/knowledge.json" | "/assets/data/manuals.json" | "/assets/data/news.json" | "/assets/data/personnel.json" | "/assets/data/plans.json" | "/assets/images/.DS_Store" | "/assets/images/activity/activities_scraped_1774257455313.jpg" | "/assets/images/activity/activities_scraped_1774257458796.jpg" | "/assets/images/activity/activities_scraped_1774257462086.jpg" | "/assets/images/activity/activities_scraped_1774257465668.jpg" | "/assets/images/activity/activities_scraped_1774257468973.jpg" | "/assets/images/activity/activities_scraped_1774257472678.jpg" | "/assets/images/activity/activities_scraped_1774257476248.jpg" | "/assets/images/activity/activities_scraped_1774257479548.jpg" | "/assets/images/activity/activities_scraped_1774257483000.jpg" | "/assets/images/activity/activities_scraped_1774257486307.jpg" | "/assets/images/activity/activities_scraped_1774257489673.jpg" | "/assets/images/activity/activities_scraped_1774257493039.jpg" | "/assets/images/activity/activities_scraped_1774257497492.jpg" | "/assets/images/activity/activities_scraped_1774257501170.jpg" | "/assets/images/activity/activities_scraped_1774257504682.jpg" | "/assets/images/activity/activities_scraped_1774257508856.jpg" | "/assets/images/activity/activities_scraped_1774257512396.jpg" | "/assets/images/activity/activities_scraped_1774257515777.jpg" | "/assets/images/activity/activities_scraped_1774257519253.jpg" | "/assets/images/activity/activities_scraped_1774257522616.jpg" | "/assets/images/activity/activities_scraped_1774257525763.jpg" | "/assets/images/activity/activities_scraped_1774257529837.jpg" | "/assets/images/activity/activities_scraped_1774257533178.jpg" | "/assets/images/activity/activity_1768466861.jpg" | "/assets/images/activity/activity_1768467339.jpg" | "/assets/images/activity/activity_1768467540.jpg" | "/assets/images/activity/activity_1768467682.jpg" | "/assets/images/activity/activity_1768467770.jpg" | "/assets/images/activity/activity_1768467907.jpg" | "/assets/images/activity/activity_1768468067.jpg" | "/assets/images/activity/activity_1768468326.jpg" | "/assets/images/activity/activity_1768468464.jpg" | "/assets/images/activity/activity_1768468563.jpg" | "/assets/images/activity/activity_1768468665.jpg" | "/assets/images/activity/activity_1768468765.jpg" | "/assets/images/activity/activity_1768468829.jpg" | "/assets/images/activity/activity_1768469157.jpg" | "/assets/images/activity/activity_1768469293.jpg" | "/assets/images/activity/activity_1768469355.jpg" | "/assets/images/activity/activity_1768469455.jpg" | "/assets/images/activity/activity_1768469940.jpg" | "/assets/images/activity/activity_1768470381.jpg" | "/assets/images/activity/activity_1768470775.jpg" | "/assets/images/activity/activity_1768470944.jpg" | "/assets/images/activity/activity_1768472192.jpg" | "/assets/images/activity/activity_1768472313.jpg" | "/assets/images/activity/activity_1768472540.jpg" | "/assets/images/activity/activity_1768472665.jpg" | "/assets/images/activity/activity_1768472786.jpg" | "/assets/images/activity/activity_1768472856.jpg" | "/assets/images/activity/activity_1768473146.jpg" | "/assets/images/activity/activity_1768475056.jpg" | "/assets/images/activity/activity_1768475227.jpg" | "/assets/images/activity/activity_1768552401.jpg" | "/assets/images/activity/activity_1768552477.jpg" | "/assets/images/activity/activity_1768552953.jpg" | "/assets/images/activity/activity_1768553146.jpg" | "/assets/images/activity/activity_1768553243.jpg" | "/assets/images/activity/activity_1768553419.jpg" | "/assets/images/activity/activity_1768553484.jpg" | "/assets/images/activity/activity_1768553551.jpg" | "/assets/images/activity/activity_1768553826.jpg" | "/assets/images/activity/activity_1768553926.jpg" | "/assets/images/activity/activity_1768554039.jpg" | "/assets/images/activity/activity_1768554112.jpg" | "/assets/images/activity/activity_1768554204.jpg" | "/assets/images/activity/activity_1768554272.jpg" | "/assets/images/activity/activity_1768554301.jpg" | "/assets/images/activity/activity_1768554399.jpg" | "/assets/images/activity/activity_1768554584.jpg" | "/assets/images/activity/activity_1768554658.jpg" | "/assets/images/activity/activity_1768554772.jpg" | "/assets/images/activity/activity_1768556419.jpg" | "/assets/images/activity/activity_1768624534.jpg" | "/assets/images/activity/activity_1768624584.jpg" | "/assets/images/activity/activity_1768624670.jpg" | "/assets/images/activity/activity_1768624778.jpg" | "/assets/images/activity/dev_2569.jpg" | "/assets/images/activity/obec_12.jpg" | "/assets/images/anupong.jpg" | "/assets/images/banner-bg.png" | "/assets/images/banner.png" | "/assets/images/bg-left.svg" | "/assets/images/bg-right.svg" | "/assets/images/default-avatar.png" | "/assets/images/jesara.jpg" | "/assets/images/kamol.jpg" | "/assets/images/logos/hrms.png" | "/assets/images/logos/moe.png" | "/assets/images/logos/obec.png" | "/assets/images/logos/ocsc.png" | "/assets/images/logos/otepc.png" | "/assets/images/logos/personnel.png" | "/assets/images/news/485391394_970853841891402_4957598070302683915_n.jpg" | "/assets/images/news/612647139_1198877155755735_5693279702954583665_n.jpg" | "/assets/images/news/news-1.jpg" | "/assets/images/news/news-2.jpg" | "/assets/images/news/news-3.jpg" | "/assets/images/news/news-4.jpg" | "/assets/images/news/news-5.jpg" | "/assets/images/news/news-6.jpg" | "/assets/images/news/news-7.jpg" | "/assets/images/news/news-8.jpg" | "/assets/images/old/banner.png" | "/assets/images/registry-system.png" | "/assets/js/data.js" | "/assets/js/firebase-config.js" | "/assets/js/main.js" | string & {};
	}
}
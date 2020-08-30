import { URISchemeHandler, URIComponents, URIOptions } from "../uri";

export interface WSComponents extends URIComponents {
	resourceName?: string;
	secure?: boolean;
}

function isSecure(wsComponents:WSComponents):boolean {
	return typeof wsComponents.secure === 'boolean' ? wsComponents.secure : String(wsComponents.scheme).toLowerCase() === "wss";
}

//RFC 6455
const handler:URISchemeHandler = {
	scheme : "ws",

	domainHost : true,

	parse : function (components:URIComponents, options:URIOptions):WSComponents {
		const wsComponents = components as WSComponents;

		//indicate if the secure flag is set
		wsComponents.secure = isSecure(wsComponents);

		//construct resouce name
		wsComponents.resourceName = (wsComponents.path || '/') + (wsComponents.query ? '?' + wsComponents.query : '');
		wsComponents.path = undefined;
		wsComponents.query = undefined;

		return wsComponents;
	},

	serialize : function (wsComponents:WSComponents, options:URIOptions):URIComponents {
		//normalize the default port
		if (wsComponents.port === (isSecure(wsComponents) ? 443 : 80) || wsComponents.port === "") {
			wsComponents.port = undefined;
		}

		//ensure scheme matches secure flag
		if (typeof wsComponents.secure === 'boolean') {
			wsComponents.scheme = (wsComponents.secure ? 'wss' : 'ws');
			wsComponents.secure = undefined;
		}

		//reconstruct path from resource name
		if (wsComponents.resourceName) {
			const [path, query] = wsComponents.resourceName.split('?');
			wsComponents.path = (path && path !== '/' ? path : undefined);
			wsComponents.query = query;
			wsComponents.resourceName = undefined;
		}

		//forbid fragment component
		wsComponents.fragment = undefined;

		return wsComponents;
	}
};

export default handler;
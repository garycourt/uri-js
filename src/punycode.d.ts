declare var punycode: {
	decode(string: string): string;
	encode(string: string): string;
	toUnicode(domain: string): string;
	toASCII(domain: string): string;
	ucs2: {
		decode(string: string): string;
		encode(codePoints: number[]): string;
	}
	version: string;
}
import includePaths from "rollup-plugin-includepaths";

const platform = process.env.PLATFORM;

if (!platform) {
	console.log("PLATFORM envvar not set, this is going to fail.");
	process.exitCode = 1;
}

const includePathsOptions = {
	include: {
		"platform.js": `src/platform/platform-${platform}.js`
	}
}

export default {
    entry: "src/app.js",
    format: "iife",
    plugins: [ includePaths(includePathsOptions) ]
};
